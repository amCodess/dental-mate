<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class AuthController extends Controller
{
 
    public function __construct()
    {
        
    }

    /**
     * Register a new user.
     */
    public function register(Request $request)
    {
        Log::info('Login/Register Attempt', ['data' => $request->all()]);

        // En el frontend actual enviamos 'name', 'email', 'password'.


        $validator = Validator::make($request->all(), [
            'name' => 'required|string|between:2,100',
            'email' => 'required|string|email|max:100|unique:Usuarios,email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            Log::warning('Validation failed', ['errors' => $validator->errors()]);
            return response()->json($validator->errors(), 400);
        } // Dividir nombre completo en nombre y apellido
        $fullName = trim($request->get('name'));
        $parts = explode(' ', $fullName, 2);
        $nombre = $parts[0];
        $apellido = isset($parts[1]) ? $parts[1] : '';
        if (empty($apellido)) {
            $apellido = '.'; // Apellido placeholder
        }

        try {
            
            DB::statement("INSERT INTO \"Usuarios\" (nombre, apellido, email, password, estado, fecha_creacion, updated_at) VALUES (?, ?, ?, ?, 'activo', NOW(), NOW())", [
                $nombre,
                $apellido,
                $request->get('email'),
                Hash::make($request->get('password'))
            ]);

            
            $user = User::where('email', $request->get('email'))->first();

            if (!$user) {
                throw new \Exception('User created but not found');
            }

            Log::info('User created successfully', ['id' => $user->id_usuario]);

            // Generar token JWT
            $token = auth('api')->login($user);

            return response()->json([
                'message' => 'User successfully registered',
                'user' => [
                    'id' => $user->id_usuario,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'email' => $user->email,
                    'is_superadmin' => (bool) $user->is_superadmin
                ],
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60
            ], 201);
        } catch (\Throwable $e) {
            $errorData = [
                'error' => 'REGISTRATION_FAILED',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ];

            file_put_contents(public_path('last_error.json'), json_encode($errorData, JSON_PRETTY_PRINT));
            Log::error('Registration Error', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return response()->json($errorData, 500)->withHeaders([
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'POST, GET, OPTIONS, PUT, DELETE',
                'Access-Control-Allow-Headers' => 'Content-Type, X-Auth-Token, Origin, Authorization'
            ]);
        }
    }


    public function login()
    {
        try {
            Log::info('Login attempt START', [
                'headers' => request()->headers->all(),
                'input' => request()->all()
            ]);

            $credentials = request(['email', 'password']);

            // Buscar usuario explícitamente para controlar estados y superadmin
            $user = User::where('email', $credentials['email'] ?? null)->first();

            if (!$user || !Hash::check($credentials['password'] ?? '', $user->password)) {
                Log::warning('Login failed - invalid credentials');
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Si estuvo soft-deleted, impedir login
            if (method_exists($user, 'trashed') && $user->trashed()) {
                return response()->json(['error' => 'Cuenta desactivada'], 403);
            }

            // Forzar flag de superadmin si es el usuario principal por email
            if ($user->email === 'admin@dentalmate.com' && !$user->is_superadmin) {
                $user->is_superadmin = true;
                $user->save();
            }

            $token = auth('api')->login($user);
            Log::info('Login success, returning token');
            return $this->respondWithToken($token);
        } catch (\Throwable $e) {
            Log::error('Login EXCEPTION: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Login Exception',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }


    public function me()
    {
        $user = auth('api')->user();
        return response()->json($this->loadUserRelations($user));
    }


    public function logout()
    {
        auth('api')->logout();

        return response()->json(['message' => 'Successfully logged out']);
    }


    public function refresh()
    {
        return $this->respondWithToken(auth('api')->refresh());
    }


    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => $this->loadUserRelations(auth('api')->user())
        ]);
    }

    private function loadUserRelations($user)
    {
        if (!$user) {
            return null;
        }

        $relations = ['clinics:id_clinica,id_empresa,nombre'];

        return $user->load($relations);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Create a new AuthController instance.
     */
    public function __construct()
    {
        // middleware for auth:api is handled in routes generally
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

        // Obtener rol por defecto (usuario)
        $defaultRole = DB::table('Roles')->where('nombre_role', 'usuario')->first();
        $roleId = $defaultRole ? $defaultRole->id_role : 1;

        try {
            // Insert user using raw SQL to avoid Eloquent issues
            DB::statement("INSERT INTO \"Usuarios\" (nombre, apellido, email, password, id_role, estado, fecha_creacion, updated_at) VALUES (?, ?, ?, ?, ?, 'activo', NOW(), NOW())", [
                $nombre,
                $apellido,
                $request->get('email'),
                Hash::make($request->get('password')),
                $roleId
            ]);

            // Get created user for token generation
            $user = User::where('email', $request->get('email'))->first();

            if (!$user) {
                throw new \Exception('User created but not found');
            }

            Log::info('User created successfully', ['id' => $user->id_usuario]);

            // Generate JWT token for auto-login
            $token = auth('api')->login($user);

            return response()->json([
                'message' => 'User successfully registered',
                'user' => [
                    'id' => $user->id_usuario,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role_id' => $user->id_role
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

    /**
     * Get a JWT via given credentials.
     */
    public function login()
    {
        Log::info('Login attempt', ['creds' => request(['email', 'password'])]);
        $credentials = request(['email', 'password']);

        if (!$token = auth('api')->attempt($credentials)) {
            Log::warning('Login failed - invalid credentials');
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        Log::info('Login success');
        return $this->respondWithToken($token);
    }

    /**
     * Get the authenticated User.
     */
    public function me()
    {
        return response()->json(auth('api')->user());
    }

    /**
     * Log the user out (Invalidate the token).
     */
    public function logout()
    {
        auth('api')->logout();

        return response()->json(['message' => 'Successfully logged out']);
    }

    /**
     * Refresh a token.
     */
    public function refresh()
    {
        return $this->respondWithToken(auth('api')->refresh());
    }

    /**
     * Get the token array structure.
     */
    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => auth('api')->user()
        ]);
    }
}

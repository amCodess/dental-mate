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
    public function register(Request $request) {
        Log::info('Login/Register Attempt', ['data' => $request->all()]);

        // En el frontend actual enviamos 'name', 'email', 'password'.
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|between:2,100',
            'email' => 'required|string|email|max:100|unique:Usuarios,email', 
            'password' => 'required|string|min:6',
        ]);

        if($validator->fails()){
            Log::warning('Validation failed', ['errors' => $validator->errors()]);
            return response()->json($validator->errors(), 400);
        }

        // Dividir nombre completo en nombre y apellido
        $fullName = trim($request->get('name'));
        $parts = explode(' ', $fullName, 2);
        $nombre = $parts[0];
        $apellido = isset($parts[1]) ? $parts[1] : ''; 
        if (empty($apellido)) {
            $apellido = '.'; // Apellido placeholder
        }

        // Obtener rol por defecto (usuario)
        $defaultRole = DB::table('Roles')->where('nombre_role', 'usuario')->first();
        Log::info('Role lookup', ['role' => $defaultRole]);
        $roleId = $defaultRole ? $defaultRole->id_role : 1; 

        try {
            Log::info('Creating user', [
                'nombre' => $nombre,
                'apellido' => $apellido,
                'email' => $request->get('email'),
                'role_id' => $roleId
            ]);

            $user = User::create([
                'nombre' => $nombre,
                'apellido' => $apellido,
                'email' => $request->get('email'),
                'password' => Hash::make($request->get('password')),
                'id_role' => $roleId,
                'estado' => 'activo'
            ]);

            Log::info('User created', ['id' => $user->id_usuario]);

            $token = auth('api')->login($user);
            Log::info('Token generated');

            return response()->json([
                'message' => 'User successfully registered',
                'user' => [
                    'id' => $user->id_usuario,
                    'name' => $user->name, 
                    'email' => $user->email,
                    'role_id' => $user->id_role
                ],
                'token' => $this->respondWithToken($token)->original
            ], 201);
        } catch (\Exception $e) {
            Log::error('Registration Error', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Registration failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get a JWT via given credentials.
     */
    public function login()
    {
        Log::info('Login attempt', ['creds' => request(['email', 'password'])]);
        $credentials = request(['email', 'password']);

        if (! $token = auth('api')->attempt($credentials)) {
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

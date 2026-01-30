<?php
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

echo "--- VERIFICANDO ROLES ---\n";
$roles = DB::table('Roles')->get();
echo "Roles encontrados: " . $roles->count() . "\n";
foreach($roles as $r) {
    echo "- ID: {$r->id_role}, Nombre: {$r->nombre_role}\n";
}

echo "\n--- VERIFICANDO USUARIO (profesionalemailame@gmail.com) ---\n";
$user = DB::table('Usuarios')->where('email', 'profesionalemailame@gmail.com')->first();
if ($user) {
    echo "Usuario ENCONTRADO:\n";
    print_r($user);
} else {
    echo "Usuario NO encontrado.\n";
}

echo "\n--- PROBANDO CREACIÓN DE USUARIO TEST ---\n";
try {
    $role = Role::where('nombre_role', 'usuario')->first();
    if (!$role) {
        throw new Exception("Rol 'usuario' no encontrado");
    }
    
    $testEmail = 'test_script_' . time() . '@example.com';
    echo "Intentando crear usuario con email: $testEmail\n";
    
    $newUser = User::create([
        'nombre' => 'Test',
        'apellido' => 'Script',
        'email' => $testEmail,
        'password' => Hash::make('123456'),
        'id_role' => $role->id_role,
        'estado' => 'activo'
    ]);
    
    echo "Usuario creado EXITOSAMENTE con ID: " . $newUser->id_usuario . "\n";
    
    // Limpieza
    $newUser->delete();
    echo "Usuario de prueba eliminado.\n";
    
} catch (Exception $e) {
    echo "ERROR CREANDO USUARIO: " . $e->getMessage() . "\n";
}

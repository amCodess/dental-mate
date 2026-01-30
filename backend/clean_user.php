<?php
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "--- LIMPIEZA DE USUARIO ---\n";
$email = 'profesionalemailame@gmail.com';
$deleted = DB::table('Usuarios')->where('email', $email)->delete();
echo "Usuarios eliminados con email '$email': $deleted\n";

echo "\n--- VERIFICANDO ESTADO ---\n";
$exists = DB::table('Usuarios')->where('email', $email)->exists();
echo "Usuario existe aun? " . ($exists ? 'SI' : 'NO') . "\n";

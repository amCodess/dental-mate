<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class ResetAdminPasswordSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::where('email', 'admin@dentalmate.com')->first();
        if ($user) {
            $user->password = Hash::make('Admin123!');
            $user->save();
            $this->command->info('Password updated for admin@dentalmate.com');
        } else {
            $this->command->error('User not found');
        }
    }
}

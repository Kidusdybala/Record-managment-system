<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        // Minister
        User::updateOrCreate(
            ['email' => 'minister@ministry.gov'],
            [
                'name' => 'Dr. Belete Molla',
                'password' => Hash::make('minister123'),
                'role' => 'minister',
                'department_id' => null,
            ]
        );

        // Record Office (Admin)
        User::updateOrCreate(
            ['email' => 'admin@ministry.gov'],
            [
                'name' => 'Sarah Mohamed',
                'password' => Hash::make('admin123'),
                'role' => 'record_office',
                'department_id' => null,
            ]
        );

        // Department of Innovation and Technology (DIT)
        User::updateOrCreate(
            ['email' => 'dit@ministry.gov'],
            [
                'name' => 'Omar Ali',
                'password' => Hash::make('dept123'),
                'role' => 'department',
                'department_id' => 1, // Assuming DIT has ID 1
            ]
        );

        // Additional department users if needed
        // foreach (Department::all() as $dept) {
        //     $email = strtolower($dept->code) . '@ministry.gov';
        //     User::updateOrCreate(
        //         ['email' => $email],
        //         [
        //             'name' => $dept->name . ' Officer',
        //             'password' => Hash::make('dept123'),
        //             'role' => 'department',
        //             'department_id' => $dept->id,
        //         ]
        //     );
        // }
    }
}
<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DepartmentsSeeder extends Seeder
{
    public function run(): void
    {
        $names = [
            'Digital Transformation', 'Cybersecurity', 'Research & Innovation', 'ICT Infrastructure',
            'Data & Analytics', 'e-Government Services', 'AI & Emerging Tech', 'Standards & Compliance',
            'Policy & Regulation', 'Grants & Funding', 'International Cooperation', 'Procurement & Logistics',
            'Public Engagement', 'Training & Capacity', 'Startup & Incubation', 'Intellectual Property',
            'Open Data', 'Cloud Services', 'Enterprise Systems', 'Telecommunications',
            'Rural Connectivity', 'Smart Cities', 'Sustainable Tech', 'Project Management',
        ];

        foreach ($names as $name) {
            Department::firstOrCreate(
                ['code' => Str::slug($name)],
                ['name' => $name]
            );
        }
    }
}
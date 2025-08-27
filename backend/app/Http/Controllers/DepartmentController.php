<?php

namespace App\Http\Controllers;

use App\Models\Department;

class DepartmentController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Department::select('id','name','code')->orderBy('name')->get(),
        ]);
    }
}
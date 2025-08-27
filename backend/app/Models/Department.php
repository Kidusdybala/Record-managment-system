<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'code'
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function outgoingLetters()
    {
        return $this->hasMany(Letter::class, 'from_department_id');
    }

    public function incomingLetters()
    {
        return $this->hasMany(Letter::class, 'to_department_id');
    }
}

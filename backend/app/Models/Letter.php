<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Letter extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject', 'body', 'document_path', 'document_name', 'document_type', 'document_size', 'description', 'from_department_id', 'to_department_id', 'requires_minister', 'status', 'created_by_user_id', 'reviewed_by_admin_id', 'minister_decision', 'reviewed_at', 'minister_decided_at'
    ];

    protected $casts = [
        'requires_minister' => 'boolean',
        'reviewed_at' => 'datetime',
        'minister_decided_at' => 'datetime',
    ];

    public function fromDepartment()
    {
        return $this->belongsTo(Department::class, 'from_department_id');
    }

    public function toDepartment()
    {
        return $this->belongsTo(Department::class, 'to_department_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function adminReviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by_admin_id');
    }
}

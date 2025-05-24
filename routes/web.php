<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\AuthController;
use App\Models\Student;

Route::get('/', function () {
    $loginName = Session::get('login_name');
    return view('welcome', compact('loginName'));
});
Route::get('/students', [StudentController::class, 'index'])->name('students.index');

Route::post('/students', [StudentController::class, 'store'])->name('students.store');

Route::patch('/students/{id}', [StudentController::class, 'update'])->name('students.update');

Route::delete('/students/{id}', [StudentController::class, 'destroy'])->name('students.destroy');

Route::post('/login', [AuthController::class, 'login'])->name('login');

Route::post('/logout', function () {
   $studentId = Session::get('student_id');

    if ($studentId) {
        $student = Student::find($studentId);
        if ($student) {
            $student->status = 0;
            $student->save();
        }
    }

    Session::flush();
    return redirect('/');
})->name('logout');

Route::get('/dashboard', function () {
    return view('students.dashboard');
});

Route::get('/tasks', function () {
    return view('students.tasks');
});


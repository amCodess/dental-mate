<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Notification;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        // Aquí podríamos filtrar por usuario logueado; devolvemos todas por ahora
        $notifications = Notification::query()
            ->select([
                'id_notificacion',
                'id_empresa',
                'id_usuario',
                'id_paciente',
                'titulo',
                'mensaje',
                'leida',
                'fecha_envio'
            ])
            ->orderBy('fecha_envio', 'desc')
            ->simplePaginate(10);
        return response()->json($notifications);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_empresa' => 'required|integer',
            'id_usuario' => 'required|integer',
            'titulo' => 'required|string',
            'mensaje' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $notification = Notification::create($request->all());
        return response()->json($notification, 201);
    }

    public function markAsRead($id)
    {
        $notification = Notification::find($id);
        if (!$notification)
            return response()->json(['message' => 'Not found'], 404);

        $notification->update(['leida' => true]);
        return response()->json($notification);
    }
}

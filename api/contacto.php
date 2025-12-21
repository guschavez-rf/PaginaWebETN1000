<?php
// Deshabilitar display de errores (solo logging)
ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);

// ===== CONFIGURACIÓN =====
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuración de emai
$to_email = "meliaruquipa@gmail.com"; 
$from_name = "Formulario de Contacto - Web UMSA";

// ===== PROCESAR SOLICITUD =====
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    try {
        // Obtener datos JSON
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('JSON inválido: ' . json_last_error_msg());
        }
    
    // Validar datos
    $name = isset($data['name']) ? trim($data['name']) : '';
    $email = isset($data['email']) ? trim($data['email']) : '';
    $subject = isset($data['subject']) ? trim($data['subject']) : '';
    $message = isset($data['message']) ? trim($data['message']) : '';
    
    // Validaciones
    if (empty($name) || empty($email) || empty($subject) || empty($message)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Todos los campos son obligatorios'
        ]);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Email inválido'
        ]);
        exit;
    }
    
    // Prevenir inyección de headers
    $name = str_replace(["\r", "\n"], '', $name);
    $email = str_replace(["\r", "\n"], '', $email);
    $subject = str_replace(["\r", "\n"], '', $subject);
    
    // ===== GUARDAR EN ARCHIVO =====
    $log_file = __DIR__ . '/contactos.txt';
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "\n========================================\n";
    $log_entry .= "Fecha: $timestamp\n";
    $log_entry .= "Nombre: $name\n";
    $log_entry .= "Email: $email\n";
    $log_entry .= "Asunto: $subject\n";
    $log_entry .= "Mensaje:\n$message\n";
    $log_entry .= "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'desconocida') . "\n";
    $log_entry .= "========================================\n";
    
    @file_put_contents($log_file, $log_entry, FILE_APPEND);
    
    // ===== ENVIAR EMAIL =====
    $email_subject = "Contacto Web: " . $subject;
    $email_body = "Has recibido un nuevo mensaje de contacto:\n\n";
    $email_body .= "Nombre: $name\n";
    $email_body .= "Email: $email\n";
    $email_body .= "Asunto: $subject\n\n";
    $email_body .= "Mensaje:\n$message\n\n";
    $email_body .= "---\n";
    $email_body .= "Enviado desde: " . ($_SERVER['HTTP_HOST'] ?? 'localhost') . "\n";
    $email_body .= "Fecha: $timestamp\n";
    $email_body .= "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'desconocida');
    
    $headers = "From: $from_name <noreply@" . ($_SERVER['HTTP_HOST'] ?? 'localhost') . ">\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    $mail_sent = @mail($to_email, $email_subject, $email_body, $headers);
    
    // ===== RESPUESTA =====
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Mensaje recibido correctamente. Te contactaremos pronto.',
        'email_sent' => $mail_sent
    ], JSON_UNESCAPED_UNICODE);
    
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error del servidor: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
    
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ], JSON_UNESCAPED_UNICODE);
}
?>
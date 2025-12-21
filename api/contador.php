<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Usar SQLite (no necesita MySQL)
    $dbPath = __DIR__ . '/contador.db';
    $db = new PDO("sqlite:$dbPath");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Crear tabla si no existe
    $db->exec("CREATE TABLE IF NOT EXISTS contador (
        id INTEGER PRIMARY KEY,
        visitas INTEGER DEFAULT 0,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Insertar registro inicial si no existe
    $stmt = $db->query("SELECT COUNT(*) as count FROM contador WHERE id = 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($row['count'] == 0) {
        $db->exec("INSERT INTO contador (id, visitas) VALUES (1, 0)");
    }
    
    // Leer datos JSON del request
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? 'increment';
    
    if ($action === 'increment') {
        // Incrementar contador
        $stmt = $db->query("SELECT visitas FROM contador WHERE id = 1");
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $newCount = $row['visitas'] + 1;
        
        $db->exec("UPDATE contador SET visitas = $newCount WHERE id = 1");
        
        echo json_encode([
            'success' => true,
            'count' => $newCount,
            'message' => 'Contador actualizado'
        ]);
        
    } elseif ($action === 'reset') {
        // Resetear contador
        $db->exec("UPDATE contador SET visitas = 0 WHERE id = 1");
        
        echo json_encode([
            'success' => true,
            'count' => 0,
            'message' => 'Contador reiniciado'
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>

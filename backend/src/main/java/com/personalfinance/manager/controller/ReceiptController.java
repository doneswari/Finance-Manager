package com.personalfinance.manager.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/receipts")
public class ReceiptController {

    private final Path uploadDir;

    public ReceiptController() {
        // Resolve uploads folder in the root path
        this.uploadDir = Paths.get("uploads").toAbsolutePath().normalize();
        try {
            if (!Files.exists(this.uploadDir)) {
                Files.createDirectories(this.uploadDir);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage folder for receipts!", e);
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadReceipt(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "File is empty");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        try {
            String originalFilename = file.getOriginalFilename();
            String cleanName = originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_") : "receipt";
            String uniqueName = UUID.randomUUID().toString() + "_" + cleanName;
            
            Path targetPath = this.uploadDir.resolve(uniqueName).normalize();
            
            // Double check directory traversal attacks
            if (!targetPath.startsWith(this.uploadDir)) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Invalid file name path");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            Map<String, String> response = new HashMap<>();
            // We expose this as a direct download url that requires no auth
            response.put("receiptUrl", "/api/receipts/download/" + uniqueName);
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Could not store the file. Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/download/{filename:.+}")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable String filename) {
        try {
            Path filePath = this.uploadDir.resolve(filename).normalize();
            
            // Security check against directory traversal
            if (!filePath.startsWith(this.uploadDir) || !Files.exists(filePath) || Files.isDirectory(filePath)) {
                return ResponseEntity.notFound().build();
            }

            byte[] data = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(data);
                    
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

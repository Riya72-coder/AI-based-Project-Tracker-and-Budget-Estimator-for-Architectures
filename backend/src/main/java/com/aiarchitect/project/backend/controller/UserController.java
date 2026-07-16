package com.aiarchitect.project.backend.controller;

import com.aiarchitect.project.backend.model.User;
import com.aiarchitect.project.backend.model.Notification; // 🔥 NEW
import com.aiarchitect.project.backend.repository.UserRepository;
import com.aiarchitect.project.backend.repository.NotificationRepository; // 🔥 NEW
import com.aiarchitect.project.backend.security.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;

import java.nio.file.*;
import java.time.LocalDateTime; // 🔥 NEW
import java.util.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepo; // 🔥 NEW

    // ================= REGISTER =================
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {

        if (user.getRole() == null) {
            user.setRole("USER");
        }

        User savedUser = userRepository.save(user);

        // 🔥 ADMIN NOTIFICATION (NEW USER REGISTER)
        Notification n = new Notification();
        n.setUserEmail("ADMIN");
        n.setMessage("New User Registered: " + savedUser.getEmail());
        n.setRead(false);
        n.setCreatedAt(LocalDateTime.now());
        notificationRepo.save(n);

        return ResponseEntity.ok(savedUser);
    }

    // ================= LOGIN (JWT + ROLE 🔥) =================
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User loginUser) {

        User existingUser = userRepository.findByEmail(loginUser.getEmail())
                .orElse(null);

        if (existingUser == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        if (!existingUser.getPassword().equals(loginUser.getPassword())) {
            return ResponseEntity.status(401).body("Invalid password");
        }

        String token = JwtUtil.generateToken(
                existingUser.getEmail(),
                existingUser.getRole()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Login Successful");
        response.put("userId", existingUser.getId());
        response.put("name", existingUser.getName());
        response.put("email", existingUser.getEmail());
        response.put("role", existingUser.getRole());
        response.put("profilePic", existingUser.getProfilePic());
        response.put("token", token);

        return ResponseEntity.ok(response);
    }

    // ================= GET CURRENT USER =================
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {

        try {
            String authHeader = request.getHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Unauthorized ❌");
            }

            String token = authHeader.substring(7);
            String email = JwtUtil.extractEmail(token);

            User user = userRepository.findByEmail(email).orElse(null);

            if (user == null) {
                return ResponseEntity.status(404).body("User not found");
            }

            return ResponseEntity.ok(user);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body("Invalid token ❌");
        }
    }

    // ================= LOGOUT =================
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok("Logged out successfully");
    }

    // ================= PROFILE UPLOAD =================
    @PostMapping("/uploadProfile/{id}")
    public ResponseEntity<?> uploadProfilePic(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();

            Path path = Paths.get("uploads/" + fileName);
            Files.createDirectories(path.getParent());
            Files.write(path, file.getBytes());

            user.setProfilePic(fileName);
            userRepository.save(user);

            return ResponseEntity.ok("Profile uploaded successfully");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Upload failed");
        }
    }

    // ================= GET USER BY ID =================
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userRepository.findById(id).orElse(null);
    }

    // ================= GET ALL USERS =================
    @GetMapping("/all")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // ================= UPDATE ROLE =================
    @PutMapping("/role/{id}")
    public ResponseEntity<?> updateRole(@PathVariable Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole().equals("ADMIN")) {
            user.setRole("USER");
        } else {
            user.setRole("ADMIN");
        }

        userRepository.save(user);

        return ResponseEntity.ok("Role Updated Successfully");
    }

    // ================= DELETE USER =================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {

        if (!userRepository.existsById(id)) {
            return ResponseEntity.badRequest().body("User not found");
        }

        userRepository.deleteById(id);

        return ResponseEntity.ok("User Deleted Successfully");
    }
}
package com.datahook.oms.security;

import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPublicKey;
import java.util.*;

/**
 * Development-only token generator.
 * Generates RS256 JWTs using an in-memory RSA key pair.
 *
 * ⚠️ ONLY active when spring.profiles.active=dev
 * In production (docker profile), this class is never loaded.
 */
@RestController
@RequestMapping("/dev")
@CrossOrigin("*")
@Profile("dev")
public class DevTokenController {

    private KeyPair keyPair;
    private final JwtIdentityProvider jwtIdentityProvider;

    public DevTokenController(JwtIdentityProvider jwtIdentityProvider) {
        this.jwtIdentityProvider = jwtIdentityProvider;
    }

    @PostConstruct
    public void init() throws NoSuchAlgorithmException {
        // Generate RSA-2048 key pair for dev token signing
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        this.keyPair = generator.generateKeyPair();

        // Register the public key with JwtIdentityProvider so it can verify dev tokens
        jwtIdentityProvider.setRsaPublicKey(keyPair.getPublic());
    }

    /**
     * Generate a test JWT token.
     * POST /dev/token
     * Body: { "name": "Alice", "email": "alice@test.com", "role": "CLIENT" }
     */
    @PostMapping("/token")
    public Map<String, Object> generateToken(@RequestBody Map<String, String> request) {
        String userId = "USR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String name = request.getOrDefault("name", "Test User");
        String email = request.getOrDefault("email", "test@example.com");
        String role = request.getOrDefault("role", "CLIENT").toUpperCase();

        String token = Jwts.builder()
                .subject(userId)
                .claim("name", name)
                .claim("email", email)
                .claim("role", role)
                .issuer("oms-dev")
                .audience().add("oms-api").and()
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 86400000)) // 24 hours
                .signWith(keyPair.getPrivate())
                .compact();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("token", token);
        response.put("userId", userId);
        response.put("name", name);
        response.put("email", email);
        response.put("role", role);
        response.put("expiresIn", "24h");
        return response;
    }

    /**
     * Get preset test users for quick login.
     * GET /dev/presets
     */
    @GetMapping("/presets")
    public List<Map<String, String>> getPresets() {
        return List.of(
                Map.of("name", "Admin User", "email", "admin@test.com", "role", "ADMIN"),
                Map.of("name", "Alice", "email", "alice@test.com", "role", "CLIENT"),
                Map.of("name", "Bob", "email", "bob@test.com", "role", "CLIENT")
        );
    }

    /**
     * Expose the dev public key in JWK format.
     * GET /dev/jwks
     */
    @GetMapping("/jwks")
    public Map<String, Object> getJwks() {
        RSAPublicKey pub = (RSAPublicKey) keyPair.getPublic();
        Map<String, Object> jwk = new LinkedHashMap<>();
        jwk.put("kty", "RSA");
        jwk.put("alg", "RS256");
        jwk.put("use", "sig");
        jwk.put("n", Base64.getUrlEncoder().withoutPadding().encodeToString(pub.getModulus().toByteArray()));
        jwk.put("e", Base64.getUrlEncoder().withoutPadding().encodeToString(pub.getPublicExponent().toByteArray()));

        return Map.of("keys", List.of(jwk));
    }
}

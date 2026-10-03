package pl.hackathon.hubofinnovations.oauth.adapter.out.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import pl.hackathon.hubofinnovations.oauth.config.JwtProperties;
import pl.hackathon.hubofinnovations.oauth.domain.model.User;
import pl.hackathon.hubofinnovations.oauth.domain.port.out.InternalJwtGenerator;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtGeneratorAdapter implements InternalJwtGenerator {
    private final SecretKey key;
    private final long expirationTimeMs;

    public JwtGeneratorAdapter(JwtProperties jwtProperties) {
        this.key = Keys.hmacShaKeyFor(jwtProperties.secret().getBytes(StandardCharsets.UTF_8));
        this.expirationTimeMs = jwtProperties.expiration();
    }

    @Override
    public String generate(User user) {
        return Jwts.builder()
                .setSubject(user.email())
                .claim("role", user.role().name())
                .claim("id", user.id().toString())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationTimeMs))
                .signWith(key)
                .compact();
    }
}
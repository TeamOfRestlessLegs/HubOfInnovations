package pl.hackathon.hubofinnovations.oauth.adapter.out.google;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import pl.hackathon.hubofinnovations.oauth.domain.port.out.GoogleTokenVerifier;

import java.util.Collections;

@Slf4j
@Component
public class GoogleIdTokenVerifierAdapter implements GoogleTokenVerifier {

    private final GoogleIdTokenVerifier verifier;

    public GoogleIdTokenVerifierAdapter(@Value("${google.client-id}") String clientId) {
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    @Override
    public GoogleUserInfo verifyAndGetInfo(String token) {
        try {
            GoogleIdToken idToken = verifier.verify(token);
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                return new GoogleUserInfo(
                        payload.getEmail(),
                        (String) payload.get("name")
                );
            } else {
                log.warn("Google token rejected (null value after verification)");
            }
        } catch (Exception e) {
            log.error("Error during Google token verification", e);
        }
        return null;
    }
}
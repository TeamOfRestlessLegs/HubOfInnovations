package pl.hackathon.hubofinnovations.oauth.domain.port.in;

import pl.hackathon.hubofinnovations.oauth.domain.model.AuthResult;

public interface AuthenticateGoogleUserUseCase {
    AuthResult authenticate(String googleIdToken);
}
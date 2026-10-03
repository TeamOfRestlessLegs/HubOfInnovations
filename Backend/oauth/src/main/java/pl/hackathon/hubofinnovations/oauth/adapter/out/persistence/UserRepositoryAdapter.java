package pl.hackathon.hubofinnovations.oauth.adapter.out.persistence;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pl.hackathon.hubofinnovations.oauth.domain.model.User;
import pl.hackathon.hubofinnovations.oauth.domain.port.out.UserRepository;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UserRepositoryAdapter implements UserRepository {

    private final SpringDataUserRepository repository;

    @Override
    public Optional<User> findByEmail(String email) {
        return repository.findByEmail(email).map(this::toDomain);
    }

    @Override
    public User save(User user) {
        UserEntity entity = UserEntity.builder()
                .id(user.id())
                .email(user.email())
                .name(user.name())
                .role(user.role())
                .build();

        UserEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    private User toDomain(UserEntity entity) {
        return new User(entity.getId(), entity.getEmail(), entity.getName(), entity.getRole());
    }
}
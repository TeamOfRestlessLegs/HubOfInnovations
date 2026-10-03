package pl.hackathon.hubofinnovations.innovations.domain.port.out;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import pl.hackathon.hubofinnovations.innovations.domain.model.Innovation;

import java.util.List;
import java.util.Optional;

public interface InnovationRepository {
    List<Innovation> findAll();
    List<Innovation> findByCategorySlug(String categorySlug);

    Page<Innovation> findAll(Pageable pageable);
    Page<Innovation> findByCategorySlug(String categorySlug, Pageable pageable);

    List<Innovation> findAllByIds(List<String> ids);
    Optional<Innovation> findById(String id);
    Innovation save(Innovation innovation);
    void delete(String id);
}
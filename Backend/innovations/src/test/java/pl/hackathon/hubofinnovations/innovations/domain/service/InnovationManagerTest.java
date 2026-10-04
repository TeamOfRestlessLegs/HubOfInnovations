package pl.hackathon.hubofinnovations.innovations.domain.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import pl.hackathon.hubofinnovations.innovations.domain.model.Category;
import pl.hackathon.hubofinnovations.innovations.domain.model.Innovation;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.InnovationSummaryDto;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.TestResultDto;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.UpsertCategoryCommand;
import pl.hackathon.hubofinnovations.innovations.domain.port.out.CategoryRepository;
import pl.hackathon.hubofinnovations.innovations.domain.port.out.InnovationRepository;
import pl.hackathon.hubofinnovations.innovations.domain.port.out.InnovationTesterRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InnovationManagerTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private InnovationRepository innovationRepository;

    @Mock
    private InnovationTesterRepository testerRepository;

    @InjectMocks
    private InnovationManager innovationManager;

    @Test
    void shouldCreateCategorySuccessfully() {
        // given
        UpsertCategoryCommand cmd = new UpsertCategoryCommand("dla-seniorow", "Dla Seniorów", "http://rops.pl");
        when(categoryRepository.findBySlug("dla-seniorow")).thenReturn(Optional.empty());
        when(categoryRepository.save(any(Category.class))).thenReturn(new Category("dla-seniorow", "Dla Seniorów", "http://rops.pl"));

        // when
        var result = innovationManager.createCategory(cmd);

        // then
        assertNotNull(result);
        assertEquals("dla-seniorow", result.slug());
        verify(categoryRepository, times(1)).save(any(Category.class));
    }

    @Test
    void shouldThrowExceptionWhenCreatingExistingCategory() {
        // given
        UpsertCategoryCommand cmd = new UpsertCategoryCommand("dla-seniorow", "Dla Seniorów", "http://rops.pl");
        when(categoryRepository.findBySlug("dla-seniorow")).thenReturn(Optional.of(new Category("dla-seniorow", "Test", "Url")));

        // when & then
        assertThrows(ResponseStatusException.class, () -> innovationManager.createCategory(cmd));
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void shouldGetInnovationsByIdsAndPreserveOrder() {
        // given - database returns results in random order
        Category cat = new Category("cat", "Cat", "url");
        Innovation i1 = new Innovation("cat/inn1", cat, "inn1", "Title 1", "Desc", "MD", "URL", null, null, OffsetDateTime.now(), "hash1", List.of());
        Innovation i2 = new Innovation("cat/inn2", cat, "inn2", "Title 2", "Desc", "MD", "URL", null, null, OffsetDateTime.now(), "hash2", List.of());

        when(innovationRepository.findAllByIds(List.of("cat/inn2", "cat/inn1")))
                .thenReturn(List.of(i1, i2)); // Database returns i1, then i2

        // when - querying in a specific order (e.g., based on AI ranking)
        List<InnovationSummaryDto> results = innovationManager.getInnovationsByIds(List.of("cat/inn2", "cat/inn1"));

        // then - the manager must preserve the input list order
        assertEquals(2, results.size());
        assertEquals("cat/inn2", results.get(0).id());
        assertEquals("cat/inn1", results.get(1).id());
    }

    @Test
    void shouldJoinAsTesterSuccessfully() {
        // given
        String categorySlug = "edukacja";
        String slug = "aplikacja-szkolna";
        String id = categorySlug + "/" + slug;

        Innovation innovation = new Innovation(id, null, slug, "Tytuł", "Opis", "MD", "URL", null, null, OffsetDateTime.now(), "hash", List.of());
        when(innovationRepository.findById(id)).thenReturn(Optional.of(innovation));
        when(testerRepository.exists(id)).thenReturn(false);

        // when
        innovationManager.joinAsTester(categorySlug, slug);

        // then
        verify(testerRepository, times(1)).saveTester(id);
    }

    @Test
    void shouldThrowNotFoundWhenJoiningNonexistentInnovation() {
        // given
        String categorySlug = "edukacja";
        String slug = "nie-istnieje";
        String id = categorySlug + "/" + slug;

        when(innovationRepository.findById(id)).thenReturn(Optional.empty());

        // when & then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> innovationManager.joinAsTester(categorySlug, slug));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(testerRepository, never()).saveTester(anyString());
    }

    @Test
    void shouldThrowConflictWhenAlreadyTester() {
        // given
        String categorySlug = "edukacja";
        String slug = "aplikacja-szkolna";
        String id = categorySlug + "/" + slug;

        Innovation innovation = new Innovation(id, null, slug, "Tytuł", "Opis", "MD", "URL", null, null, OffsetDateTime.now(), "hash", List.of());
        when(innovationRepository.findById(id)).thenReturn(Optional.of(innovation));
        when(testerRepository.exists(id)).thenReturn(true);

        // when & then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> innovationManager.joinAsTester(categorySlug, slug));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(testerRepository, never()).saveTester(anyString());
    }

    @Test
    void shouldRunTestsSuccessfullyWhenUserIsTester() {
        // given
        String categorySlug = "edukacja";
        String slug = "aplikacja-szkolna";
        String id = categorySlug + "/" + slug;

        when(testerRepository.exists(id)).thenReturn(true);

        // when
        TestResultDto result = innovationManager.runTests(categorySlug, slug);

        // then
        assertNotNull(result);
        assertEquals("SUCCESS", result.status());
        assertEquals(id, result.innovationId());
    }

    @Test
    void shouldThrowForbiddenWhenRunningTestsAndNotTester() {
        // given
        String categorySlug = "edukacja";
        String slug = "aplikacja-szkolna";
        String id = categorySlug + "/" + slug;

        when(testerRepository.exists(id)).thenReturn(false);

        // when & then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> innovationManager.runTests(categorySlug, slug));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }
}
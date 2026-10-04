package pl.hackathon.hubofinnovations.innovations.domain.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import pl.hackathon.hubofinnovations.innovations.adapter.out.persistence.IdeaEntity;
import pl.hackathon.hubofinnovations.innovations.adapter.out.persistence.SpringDataIdeaRepository;
import pl.hackathon.hubofinnovations.innovations.adapter.out.persistence.SpringDataOfficialPostRepository;
import pl.hackathon.hubofinnovations.innovations.adapter.out.persistence.SpringDataSupportRepository;
import pl.hackathon.hubofinnovations.innovations.domain.model.IdeaStatus;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.CreateIdeaCommand;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.IdeaDto;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IdeaManagerTest {

    @Mock
    private SpringDataIdeaRepository repository;

    @Mock
    private SpringDataSupportRepository supportRepository;

    @Mock
    private SpringDataOfficialPostRepository postRepository;

    @InjectMocks
    private IdeaManager ideaManager;

    @Test
    void shouldCreateIdeaSuccessfully() {
        // given
        CreateIdeaCommand cmd = new CreateIdeaCommand(
                1L, false, "Tytuł fiszki", "Problem", "Seniorzy", "Skrót", "Nowość"
        );

        IdeaEntity savedEntity = IdeaEntity.builder()
                .id(100L)
                .authorId(1L)
                .title("Tytuł fiszki")
                .status(IdeaStatus.PENDING_REVIEW)
                .build();

        when(repository.save(any(IdeaEntity.class))).thenReturn(savedEntity);

        // when
        IdeaDto result = ideaManager.createIdea(cmd, 1L);

        // then
        assertNotNull(result);
        assertEquals(100L, result.id());
        assertEquals("Tytuł fiszki", result.title());
        assertEquals(IdeaStatus.PENDING_REVIEW, result.status());
        verify(repository, times(1)).save(any(IdeaEntity.class));
    }

    @Test
    void shouldRejectIdeaSuccessfully() {
        // given
        IdeaEntity existingIdea = IdeaEntity.builder()
                .id(100L)
                .status(IdeaStatus.PENDING_REVIEW)
                .build();

        when(repository.findById(100L)).thenReturn(Optional.of(existingIdea));
        when(repository.save(any(IdeaEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        IdeaDto result = ideaManager.rejectIdea(100L, "Za mało detali", 99L);

        // then
        assertEquals(IdeaStatus.REJECTED, result.status());
        assertEquals("Za mało detali", result.rejectReason());
        verify(repository, times(1)).save(existingIdea);
        verify(postRepository, times(1)).save(any()); // Weryfikacja zapisu oficjalnego posta
    }

    @Test
    void shouldThrowExceptionWhenRejectingNonExistentIdea() {
        // given
        when(repository.findById(999L)).thenReturn(Optional.empty());

        // when & then
        assertThrows(ResponseStatusException.class, () -> ideaManager.rejectIdea(999L, "Powód", 99L));
        verify(repository, never()).save(any(IdeaEntity.class));
    }

    @Test
    void shouldReturnIdeasByStatus() {
        // given
        IdeaEntity idea1 = IdeaEntity.builder().id(1L).status(IdeaStatus.PUBLISHED).build();
        IdeaEntity idea2 = IdeaEntity.builder().id(2L).status(IdeaStatus.PUBLISHED).build();

        when(repository.findByStatus(IdeaStatus.PUBLISHED)).thenReturn(List.of(idea1, idea2));

        // when
        List<IdeaDto> results = ideaManager.getIdeasByStatus(IdeaStatus.PUBLISHED);

        // then
        assertEquals(2, results.size());
        assertEquals(1L, results.get(0).id());
        assertEquals(2L, results.get(1).id());
    }
}
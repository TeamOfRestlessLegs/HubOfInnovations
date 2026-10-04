package pl.hackathon.hubofinnovations.innovations.domain.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import pl.hackathon.hubofinnovations.innovations.adapter.out.persistence.*;
import pl.hackathon.hubofinnovations.innovations.domain.model.IdeaStatus;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.CommentCommand;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.CommentDto;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IdeaInteractionManagerTest {

    @Mock private SpringDataIdeaRepository ideaRepository;
    @Mock private SpringDataCommentRepository commentRepository;
    @Mock private SpringDataQuestionRepository questionRepository;
    @Mock private SpringDataAnswerRepository answerRepository;
    @Mock private SpringDataOfficialPostRepository postRepository;
    @Mock private SpringDataTakeoverRequestRepository takeoverRepository;

    @InjectMocks
    private IdeaInteractionManager manager;

    @Test
    void shouldAddCommentWhenIdeaIsOpen() {
        // given
        Long ideaId = 1L;
        Long userId = 2L;
        CommentCommand command = new CommentCommand("Świetny pomysł!");

        IdeaEntity openIdea = IdeaEntity.builder().id(ideaId).status(IdeaStatus.PUBLISHED).build();
        CommentEntity savedComment = CommentEntity.builder()
                .id(10L).ideaId(ideaId).authorId(userId).section("discussion").body("Świetny pomysł!").build();

        when(ideaRepository.findById(ideaId)).thenReturn(Optional.of(openIdea));
        when(commentRepository.save(any(CommentEntity.class))).thenReturn(savedComment);

        // when
        CommentDto result = manager.addComment(ideaId, "discussion", command, userId);

        // then
        assertNotNull(result);
        assertEquals(10L, result.id());
        assertEquals("Świetny pomysł!", result.body());
        verify(commentRepository, times(1)).save(any(CommentEntity.class));
    }

    @Test
    void shouldThrowExceptionWhenAddingCommentToRejectedIdea() {
        // given
        Long ideaId = 1L;
        CommentCommand command = new CommentCommand("Spóźniony komentarz");

        IdeaEntity rejectedIdea = IdeaEntity.builder().id(ideaId).status(IdeaStatus.REJECTED).build();
        when(ideaRepository.findById(ideaId)).thenReturn(Optional.of(rejectedIdea));

        // when & then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> manager.addComment(ideaId, "discussion", command, 2L));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(commentRepository, never()).save(any(CommentEntity.class));
    }

    @Test
    void shouldAcceptTakeoverRequestAndChangeLedBy() {
        // given
        Long requestId = 100L;
        Long ideaId = 1L;
        Long municipalityId = 99L;
        Long authorId = 2L;

        TakeoverRequestEntity request = TakeoverRequestEntity.builder()
                .id(requestId).ideaId(ideaId).municipalityId(municipalityId).status("pending").build();

        IdeaEntity idea = IdeaEntity.builder().id(ideaId).ledById(null).build();

        when(takeoverRepository.findById(requestId)).thenReturn(Optional.of(request));
        when(ideaRepository.findById(ideaId)).thenReturn(Optional.of(idea));

        // when
        manager.takeoverDecision(requestId, true, authorId);

        // then
        assertEquals("accepted", request.getStatus());
        assertEquals(municipalityId, idea.getLedById());

        verify(takeoverRepository, times(1)).save(request);
        verify(ideaRepository, times(1)).save(idea);
        verify(postRepository, times(1)).save(any(OfficialPostEntity.class)); // Weryfikacja dodania postu oficjalnego
    }
}
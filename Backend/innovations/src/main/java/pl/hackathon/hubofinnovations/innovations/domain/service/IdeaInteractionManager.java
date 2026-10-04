package pl.hackathon.hubofinnovations.innovations.domain.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import pl.hackathon.hubofinnovations.innovations.adapter.out.persistence.*;
import pl.hackathon.hubofinnovations.innovations.domain.model.IdeaStatus;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.IdeaInteractionUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.*;

import java.util.List;

@RequiredArgsConstructor
public class IdeaInteractionManager implements IdeaInteractionUseCase {

    private final SpringDataIdeaRepository ideaRepository;
    private final SpringDataCommentRepository commentRepository;
    private final SpringDataQuestionRepository questionRepository;
    private final SpringDataAnswerRepository answerRepository;
    private final SpringDataOfficialPostRepository postRepository;
    private final SpringDataTakeoverRequestRepository takeoverRepository;

    @Override
    public List<CommentDto> getComments(Long ideaId, String section) {
        return commentRepository.findByIdeaIdAndSection(ideaId, section).stream()
                .map(c -> new CommentDto(c.getId(), c.getIdeaId(), c.getAuthorId(), c.getSection(), c.getBody(), c.getCreatedAt()))
                .toList();
    }

    @Override
    public CommentDto addComment(Long ideaId, String section, CommentCommand command, Long userId) {
        validateIdeaIsOpen(ideaId);
        CommentEntity saved = commentRepository.save(CommentEntity.builder()
                .ideaId(ideaId).authorId(userId).section(section).body(command.body()).build());
        return new CommentDto(saved.getId(), saved.getIdeaId(), saved.getAuthorId(), saved.getSection(), saved.getBody(), saved.getCreatedAt());
    }

    @Override
    public List<QuestionDto> getQuestions(Long ideaId) {
        return questionRepository.findByIdeaId(ideaId).stream()
                .map(q -> new QuestionDto(q.getId(), q.getIdeaId(), q.getAuthorId(), q.getType(), q.getAddressee(), q.getBody(), q.getApplied(), q.getCreatedAt()))
                .toList();
    }

    @Override
    public QuestionDto askQuestion(Long ideaId, QuestionCommand command, Long userId) {
        validateIdeaIsOpen(ideaId);
        QuestionEntity saved = questionRepository.save(QuestionEntity.builder()
                .ideaId(ideaId).authorId(userId).type("question").addressee(command.addressee()).body(command.body()).applied(false).build());
        return new QuestionDto(saved.getId(), saved.getIdeaId(), saved.getAuthorId(), saved.getType(), saved.getAddressee(), saved.getBody(), saved.getApplied(), saved.getCreatedAt());
    }

    @Override
    public AnswerDto answerQuestion(Long questionId, AnswerCommand command, Long userId) {
        QuestionEntity question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pytanie nie znalezione"));
        validateIdeaIsOpen(question.getIdeaId());

        AnswerEntity saved = answerRepository.save(AnswerEntity.builder()
                .questionId(questionId).authorId(userId).body(command.body()).build());
        return new AnswerDto(saved.getId(), saved.getQuestionId(), saved.getAuthorId(), saved.getBody(), saved.getCreatedAt());
    }

    @Override
    public List<OfficialPostDto> getOfficialPosts(Long ideaId) {
        return postRepository.findByIdeaId(ideaId).stream()
                .map(p -> new OfficialPostDto(p.getId(), p.getIdeaId(), p.getAuthorId(), p.getKind(), p.getEvent(), p.getBody(), p.getCreatedAt()))
                .toList();
    }

    @Override
    public OfficialPostDto addOfficialPost(Long ideaId, OfficialPostCommand command, Long userId) {
        validateIdeaIsOpen(ideaId);
        OfficialPostEntity saved = postRepository.save(OfficialPostEntity.builder()
                .ideaId(ideaId).authorId(userId).kind("official").event(command.event()).body(command.body()).build());
        return new OfficialPostDto(saved.getId(), saved.getIdeaId(), saved.getAuthorId(), saved.getKind(), saved.getEvent(), saved.getBody(), saved.getCreatedAt());
    }

    @Override
    public void requestTakeover(Long ideaId, TakeoverRequestCommand command, Long municipalityId) {
        IdeaEntity idea = ideaRepository.findById(ideaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (idea.getLedById() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Fiszka już ma prowadzącego");
        }

        takeoverRepository.save(TakeoverRequestEntity.builder()
                .ideaId(ideaId).municipalityId(municipalityId).message(command.message()).status("pending").build());
    }

    @Override
    public void takeoverDecision(Long requestId, Boolean accept, Long authorId) {
        TakeoverRequestEntity request = takeoverRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        request.setStatus(accept ? "accepted" : "rejected");
        takeoverRepository.save(request);

        if (accept) {
            IdeaEntity idea = ideaRepository.findById(request.getIdeaId()).orElseThrow();
            idea.setLedById(request.getMunicipalityId());
            ideaRepository.save(idea);

            postRepository.save(OfficialPostEntity.builder()
                    .ideaId(idea.getId()).authorId(null).kind("status").event("takeover").body("Gmina oficjalnie przejęła prowadzenie fiszki.").build());
        }
    }

    private void validateIdeaIsOpen(Long ideaId) {
        IdeaEntity idea = ideaRepository.findById(ideaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fiszka nie znaleziona"));
        if (idea.getStatus() == IdeaStatus.REJECTED || idea.getStatus() == IdeaStatus.ARCHIVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Wątek jest zamknięty dla tej akcji");
        }
    }
}
package pl.hackathon.hubofinnovations.innovations.domain.port.in;

import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.*;
import java.util.List;

public interface IdeaInteractionUseCase {
    List<CommentDto> getComments(Long ideaId, String section);
    CommentDto addComment(Long ideaId, String section, CommentCommand command, Long userId);

    List<QuestionDto> getQuestions(Long ideaId);
    QuestionDto askQuestion(Long ideaId, QuestionCommand command, Long userId);
    AnswerDto answerQuestion(Long questionId, AnswerCommand command, Long userId);

    List<OfficialPostDto> getOfficialPosts(Long ideaId);
    OfficialPostDto addOfficialPost(Long ideaId, OfficialPostCommand command, Long userId);

    void requestTakeover(Long ideaId, TakeoverRequestCommand command, Long municipalityId);
    void takeoverDecision(Long requestId, Boolean accept, Long authorId);
}
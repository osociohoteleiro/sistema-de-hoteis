import MessageNode from './MessageNode';
import QuestionNode from './QuestionNode';
import ActionNode from './ActionNode';
import ConditionNode from './ConditionNode';
import GoToNode from './GoToNode';

export const nodeTypes = {
  message: MessageNode,
  question: QuestionNode,
  action: ActionNode,
  condition: ConditionNode,
  goto: GoToNode
};

export {
  MessageNode,
  QuestionNode,
  ActionNode,
  ConditionNode,
  GoToNode
};
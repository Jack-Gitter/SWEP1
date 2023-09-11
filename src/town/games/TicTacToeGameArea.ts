import InvalidParametersError, {
  GAME_ID_MISSMATCH_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  INVALID_COMMAND_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  GameMoveCommand,
  GameResult,
  InteractableCommand,
  InteractableCommandReturnType,
  InteractableType,
  JoinGameCommand,
  LeaveGameCommand,
  TicTacToeMove,
  GameMove,
} from '../../types/CoveyTownSocket';
import GameArea from './GameArea';
import TicTacToeGame from './TicTacToeGame';

/**
 * A TicTacToeGameArea is a GameArea that hosts a TicTacToeGame.
 * @see TicTacToeGame
 * @see GameArea
 */
export default class TicTacToeGameArea extends GameArea<TicTacToeGame> {
  protected getType(): InteractableType {
    return 'TicTacToeArea';
  }

  /**
   * Handle a command from a player in this game area.
   * Supported commands:
   * - JoinGame (joins the game `this._game`, or creates a new one if none is in progress)
   * - GameMove (applies a move to the game)
   * - LeaveGame (leaves the game)
   *
   * If the command ended the game, records the outcome in this._history
   * If the command is successful (does not throw an error), calls this._emitAreaChanged (necessary
   *  to notify any listeners of a state update, including any change to history)
   * If the command is unsuccessful (throws an error), the error is propagated to the caller
   *
   * @see InteractableCommand
   *
   * @param command command to handle
   * @param player player making the request
   * @returns response to the command, @see InteractableCommandResponse
   * @throws InvalidParametersError if the command is not supported or is invalid. Invalid commands:
   *  - LeaveGame and GameMove: No game in progress (GAME_NOT_IN_PROGRESS_MESSAGE),
   *        or gameID does not match the game in progress (GAME_ID_MISSMATCH_MESSAGE)
   *  - Any command besides LeaveGame, GameMove and JoinGame: INVALID_COMMAND_MESSAGE
   */
  private _handleJoinCommand(player: Player): InteractableCommandReturnType<JoinGameCommand> {
    if (!this._game) {
      this._game = new TicTacToeGame();
    }
    this._game.join(player);
    this._emitAreaChanged();
    return { gameID: this._game.id } as InteractableCommandReturnType<JoinGameCommand>;
  }

  private _handleLeaveCommand(
    command: LeaveGameCommand,
    player: Player,
  ): InteractableCommandReturnType<LeaveGameCommand> {
    if (!this._game) {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    if (command.gameID !== this._game.id) {
      throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
    }
    this._game.leave(player);
    this._emitAreaChanged();
    if (this._game.state.status === 'OVER') {
      const result: GameResult = {
        gameID: this._game.id,
        scores: {
          [this.occupants[0].userName !== player.userName
            ? this.occupants[0].userName
            : this.occupants[1].userName]: 1,
          [player.userName]: 0,
        },
      };
      this.history.push(result);
    }
    return undefined as InteractableCommandReturnType<LeaveGameCommand>;
  }

  private _handleMoveCommand(
    command: GameMoveCommand<TicTacToeMove>,
    player: Player,
  ): InteractableCommandReturnType<GameMoveCommand<TicTacToeMove>> {
    if (!this._game) {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    if (this._game.id !== command.gameID) {
      throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
    }
    const gameMove: GameMove<TicTacToeMove> = {
      playerID: player.id,
      gameID: command.gameID,
      move: command.move,
    };
    this._game.applyMove(gameMove);
    this._emitAreaChanged();
    if (this._game.state.status === 'OVER') {
      let result: GameResult = { gameID: this._game.id, scores: {} };
      if (this._game.state.winner !== undefined) {
        result = {
          gameID: this._game.id,
          scores: {
            [player.userName]: 1,
            [this.occupants[0].userName !== player.userName
              ? this.occupants[0].userName
              : this.occupants[1].userName]: 0,
          },
        };
      } else {
        result = {
          gameID: this._game.id,
          scores: {
            [this.occupants[0].userName]: 0,
            [this.occupants[1].userName]: 0,
          },
        };
      }
      this._history.push(result);
    }
    return undefined as InteractableCommandReturnType<GameMoveCommand<TicTacToeMove>>;
  }

  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    if (command.type === 'JoinGame') {
      return this._handleJoinCommand(player) as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'LeaveGame') {
      return this._handleLeaveCommand(
        command,
        player,
      ) as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'GameMove') {
      return this._handleMoveCommand(command, player) as InteractableCommandReturnType<CommandType>;
    }
    throw new InvalidParametersError(INVALID_COMMAND_MESSAGE);
  }
}

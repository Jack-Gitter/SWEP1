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
   * - JoinGame (joins the game `this.game`, or creates a new one if none is in progress)
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

  /**
   * Handles a join command from the player
   * If no games currently exists, creates one and adds the player
   * If a game does exist, adds the player and calls this._emitAreaChanged()
   * @param player player making the request
   * @returns InteractableCommandReturnType<JoinGameCommand> as specified by calling function
   */
  private _handleJoinCommand(player: Player): InteractableCommandReturnType<JoinGameCommand> {
    if (!this._game) {
      this._game = new TicTacToeGame();
    }
    this._game.join(player);
    this._emitAreaChanged();
    return { gameID: this._game.id } as InteractableCommandReturnType<JoinGameCommand>;
  }

  /**
   * Handles a leave command from the player
   *    If a game is not in progress or the gameID does not match the current game, throws error
   *    If a player successfully leaves the game, checks if it is over or not and updates
   *      game history accordingly
   * @param command the LeaveGameCommand
   * @param player player making the request
   * @returns InteractableCommandReturnType<HandleLeaveCommand> as specified by calling function
   */
  private _handleLeaveCommand(
    command: LeaveGameCommand,
    player: Player,
  ): InteractableCommandReturnType<LeaveGameCommand> {
    if (!this.game) {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    if (command.gameID !== this.game.id) {
      throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
    }
    this.game.leave(player);
    this._emitAreaChanged();
    if (this.game.state.status === 'OVER') {
      const result: GameResult = {
        gameID: this.game.id,
        scores: {
          [this.occupants[0].id === this.game.state.winner
            ? this.occupants[0].userName
            : this.occupants[1].userName]: 1,
          [this.occupants[0].id !== this.game.state.winner
            ? this.occupants[0].userName
            : this.occupants[1].userName]: 0,
        },
      };
      this.history.push(result);
    }
    return undefined as InteractableCommandReturnType<LeaveGameCommand>;
  }

  /**
   * Handles a move command issued by the player
   * If there is not a current game or game ID does not match the one given throws an error
   * If the game move is invalid throws an error
   * Otherwise applies a move to the game
   * If a winner is found, updates the history
   * @param command the GameMoveCommand<TicTacToeMove> issued
   * @param player the player making the request
   * @returns InteractableCommandReturnType<GameMoveCommand<TicTacToeMove>>
   * as specified by calling function
   */
  private _handleMoveCommand(
    command: GameMoveCommand<TicTacToeMove>,
    player: Player,
  ): InteractableCommandReturnType<GameMoveCommand<TicTacToeMove>> {
    if (!this.game) {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    if (this.game.id !== command.gameID) {
      throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
    }
    const gameMove: GameMove<TicTacToeMove> = {
      playerID: player.id,
      gameID: command.gameID,
      move: command.move,
    };
    this.game.applyMove(gameMove);
    this._emitAreaChanged();
    if (this.game.state.status === 'OVER') {
      let result: GameResult = { gameID: this.game.id, scores: {} };
      if (this.game.state.winner !== undefined) {
        result = {
          gameID: this.game.id,
          scores: {
            [player.userName]: 1,
            [this.occupants[0].userName !== player.userName
              ? this.occupants[0].userName
              : this.occupants[1].userName]: 0,
          },
        };
      } else {
        result = {
          gameID: this.game.id,
          scores: {
            [this.occupants[0].userName]: 0,
            [this.occupants[1].userName]: 0,
          },
        };
      }
      this.history.push(result);
    }
    return undefined as InteractableCommandReturnType<GameMoveCommand<TicTacToeMove>>;
  }
}

import InvalidParametersError, {
  BOARD_POSITION_NOT_EMPTY_MESSAGE,
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import { GameMove, TicTacToeGameState, TicTacToeMove } from '../../types/CoveyTownSocket';
import Game from './Game';

/**
 * A TicTacToeGame is a Game that implements the rules of Tic Tac Toe.
 * @see https://en.wikipedia.org/wiki/Tic-tac-toe
 */
export default class TicTacToeGame extends Game<TicTacToeGameState, TicTacToeMove> {
  public constructor() {
    super({
      moves: [],
      status: 'WAITING_TO_START',
    });
  }

  /*
   * Applies a player's move to the game.
   * Uses the player's ID to determine which game piece they are using (ignores move.gamePiece)
   * Validates the move before applying it. If the move is invalid, throws an InvalidParametersError with
   * the error message specified below.
   * A move is invalid if:
   *    - The move is on a space that is already occupied (use BOARD_POSITION_NOT_EMPTY_MESSAGE)
   *    - The move is not the player's turn (MOVE_NOT_YOUR_TURN_MESSAGE)
   *    - The game is not in progress (GAME_NOT_IN_PROGRESS_MESSAGE)
   *
   * If the move is valid, applies the move to the game and updates the game state.
   *
   * If the move ends the game, updates the game's state.
   * If the move results in a tie, updates the game's state to set the status to OVER and sets winner to undefined.
   * If the move results in a win, updates the game's state to set the status to OVER and sets the winner to the player who made the move.
   * A player wins if they have 3 in a row (horizontally, vertically, or diagonally).
   *
   * @param move The move to apply to the game
   * @throws InvalidParametersError if the move is invalid (with specific message noted above)
   */
  private _moveIsValid(move: TicTacToeMove, moves: ReadonlyArray<TicTacToeMove>): boolean {
    // check for game is not in progress
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    // check for space not occupied
    moves.forEach(m => {
      if (m.col === move.col && m.row === move.row) {
        throw new InvalidParametersError(BOARD_POSITION_NOT_EMPTY_MESSAGE);
      }
    });
    // check for move not players turn
    if (this.state.moves.length === 0 && move.gamePiece === 'O') {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    }
    if (
      this.state.moves.length > 0 &&
      move.gamePiece === this.state.moves[this.state.moves.length - 1].gamePiece
    ) {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    }
    return true;
  }

  private _playerHasWon(moves: ReadonlyArray<TicTacToeMove>): boolean {
    // check horizontal and vertical wins
    let topLeftDiagonals = [];
    let topRightDiagonals = [];
    for (let i = 0; i < moves.length; i++) {
      let countInRow = 1;
      let countInColumn = 1;
      if (moves[i].col === moves[i].row) {
        if (
          topLeftDiagonals.length > 0 &&
          topLeftDiagonals[topLeftDiagonals.length - 1] !== moves[i].gamePiece
        ) {
          topLeftDiagonals = [];
        } else {
          topLeftDiagonals.push(moves[i].gamePiece);
        }
      }
      if (moves[i].col + moves[i].row === 2) {
        if (
          topRightDiagonals.length > 0 &&
          topRightDiagonals[topRightDiagonals.length - 1] !== moves[i].gamePiece
        ) {
          topRightDiagonals = [];
        } else {
          topRightDiagonals.push(moves[i].gamePiece);
        }
      }
      for (let j = i + 1; j < moves.length; j++) {
        if (moves[j].col === moves[i].col && moves[j].gamePiece === moves[i].gamePiece) {
          countInColumn += 1;
        }
        if (moves[j].row === moves[i].row && moves[j].gamePiece === moves[i].gamePiece) {
          countInRow += 1;
        }
      }
      if (
        countInRow === 3 ||
        countInColumn === 3 ||
        topLeftDiagonals.length === 3 ||
        topRightDiagonals.length === 3
      ) {
        return true;
      }
    }
    // check diagonal wins
    return false;
  }

  private _gameHasTied(moves: ReadonlyArray<TicTacToeMove>): boolean {
    return moves.length === 9;
  }

  public applyMove(move: GameMove<TicTacToeMove>): void {
    // Assign the correct game piece to the player
    if (this.state.x === move.playerID) {
      move.move.gamePiece = 'X';
    } else {
      move.move.gamePiece = 'O';
    }

    // Check for valid moves and wins
    if (this._moveIsValid(move.move, this.state.moves)) {
      this.state.moves = this.state.moves.concat(move.move);
      if (this._playerHasWon(this.state.moves)) {
        this.state.status = 'OVER';
        this.state.winner = move.playerID;
      } else if (this._gameHasTied(this.state.moves)) {
        this.state.status = 'OVER';
        this.state.winner = undefined;
      }
    }
  }

  /**
   * Adds a player to the game.
   * Updates the game's state to reflect the new player.
   * If the game is now full (has two players), updates the game's state to set the status to IN_PROGRESS.
   *
   * @param player The player to join the game
   * @throws InvalidParametersError if the player is already in the game (PLAYER_ALREADY_IN_GAME_MESSAGE)
   *  or the game is full (GAME_FULL_MESSAGE)
   */
  public _join(player: Player): void {
    if (this._players.indexOf(player) !== -1) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    } else if (this._players.length === 2) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    } else if (this._players.length < 2) {
      if (this._players.length === 0) {
        this.state.x = player.id;
      } else if (this._players.length === 1) {
        this.state.o = player.id;
        this.state.status = 'IN_PROGRESS';
      }
    }
  }

  /**
   * Removes a player from the game.
   * Updates the game's state to reflect the player leaving.
   * If the game has two players in it at the time of call to this method,
   *   updates the game's status to OVER and sets the winner to the other player.
   * If the game does not yet have two players in it at the time of call to this method,
   *   updates the game's status to WAITING_TO_START.
   *
   * @param player The player to remove from the game
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   */
  protected _leave(player: Player): void {
    if (this._players.indexOf(player) === -1) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    if (this._players.length === 1) {
      this.state.status = 'WAITING_TO_START';
    } else if (this._players.length === 2) {
      this.state.status = 'OVER';
      this.state.winner =
        this._players[0].id === player.id ? this._players[1].id : this._players[0].id;
    }
  }
}

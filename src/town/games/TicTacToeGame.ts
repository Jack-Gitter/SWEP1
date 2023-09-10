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

  /**
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
   * */

  public applyMove(move: GameMove<TicTacToeMove>): void {
    if (this.state.x === move.playerID) {
      move.move.gamePiece = 'X';
    } else {
      move.move.gamePiece = 'O';
    }

    if (this._moveIsValid(move)) {
      this.state.moves = this.state.moves.concat(move.move);
      if (this._playerHasWon(move)) {
        this.state.status = 'OVER';
        this.state.winner = move.playerID;
      } else if (this.state.moves.length === 9) {
        this.state.status = 'OVER';
        this.state.winner = undefined;
      }
    }
  }

  /**
   * Ensures that a move is valid based on the current game state
   * @param move The move to apply to the gamk
   * @throws InvalidParametersError if the move is invalid (specified by the applyMove method)
   * @returns true if the move is valid
   */

  private _moveIsValid(move: GameMove<TicTacToeMove>): boolean {
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }

    this.state.moves.forEach(m => {
      if (m.col === move.move.col && m.row === move.move.row) {
        throw new InvalidParametersError(BOARD_POSITION_NOT_EMPTY_MESSAGE);
      }
    });

    if (this.state.moves.length === 0 && move.move.gamePiece === 'O') {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    }

    if (
      this.state.moves.length > 0 &&
      move.move.gamePiece === this.state.moves[this.state.moves.length - 1].gamePiece
    ) {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    }

    return true;
  }

  /**
   * Determines if a player has won based on the moves that have occured in the game
   * @returns true if a player has won the current game, false otherwise
   */

  private _playerHasWon(move: GameMove<TicTacToeMove>): boolean {
    return (
      this._checkForHorizontalWins(move) ||
      this._checkForVerticalWins(move) ||
      this._checkForDiagonalWins(move)
    );
  }

  /**
   * Determines if a win has been made on the diagonal of the tictactoe board
   * @param move the most recent move that has been applied to the game
   * @returns true if a player has won on either diagonal, false otherwise
   */

  private _checkForDiagonalWins(move: GameMove<TicTacToeMove>): boolean {
    const diagonals: string[][] = [[], []];
    for (let i = 0; i < this.state.moves.length; i++) {
      if (this.state.moves[i].gamePiece === move.move.gamePiece) {
        if (this.state.moves[i].col === this.state.moves[i].row) {
          diagonals[0].push(move.move.gamePiece);
          if (diagonals[0].length === 3) {
            return true;
          }
        }
        if (this.state.moves[i].col + this.state.moves[i].row === 2) {
          diagonals[1].push(move.move.gamePiece);
          if (diagonals[1].length === 3) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Determines if a win has been made on the columns of a tictactoe board
   * @param move the most recent move that has been applied to the game
   * @returns true if a win has been made on any column, false otherwise
   */

  private _checkForVerticalWins(move: GameMove<TicTacToeMove>) {
    const ticTacToeBoard: string[][] = [[], [], []];
    for (let i = 0; i < this.state.moves.length; i++) {
      if (this.state.moves[i].gamePiece === move.move.gamePiece) {
        ticTacToeBoard[this.state.moves[i].col].push(move.move.gamePiece);
      }
      if (ticTacToeBoard[this.state.moves[i].col].length === 3) {
        return true;
      }
    }
    return false;
  }

  /**
   * Determines if a win has been made on the rows of a tictactoe board
   * @param move the most recent move that has been applied ot the game
   * @returns true if a win has been made on any row, false otherwise
   */

  private _checkForHorizontalWins(move: GameMove<TicTacToeMove>): boolean {
    const ticTacToeBoard: string[][] = [[], [], []];
    for (let i = 0; i < this.state.moves.length; i++) {
      if (this.state.moves[i].gamePiece === move.move.gamePiece) {
        ticTacToeBoard[this.state.moves[i].row].push(move.move.gamePiece);
      }
      if (ticTacToeBoard[this.state.moves[i].row].length === 3) {
        return true;
      }
    }
    return false;
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
    if (this.state.status === 'IN_PROGRESS') {
      this.state.status = 'OVER';
      this.state.winner =
        this._players[0].id === player.id ? this._players[1].id : this._players[0].id;
    } else {
      this.state.status = 'WAITING_TO_START';
    }
  }
}

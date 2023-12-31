import { createPlayerForTesting } from '../../TestUtils';
import InvalidParametersError, {
  BOARD_POSITION_NOT_EMPTY_MESSAGE,
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import { GameStatus, TicTacToeMove } from '../../types/CoveyTownSocket';
import TicTacToeGame from './TicTacToeGame';

describe('TicTacToeGame', () => {
  let game: TicTacToeGame;

  beforeEach(() => {
    game = new TicTacToeGame();
  });

  /**
   * helps to run expects against the expected state of the game
   * @param player1 the expected player for x
   * @param player2 the expected player for o
   * @param winner the expected winner
   * @param numberOfMoves the expected number of moves
   * @param status the expected status
   */
  function ensureStateIsAsExpected(
    player1: Player | undefined,
    player2: Player | undefined,
    winner: Player | undefined,
    numberOfMoves: number,
    status: GameStatus,
  ): void {
    expect(game.state.moves).toHaveLength(numberOfMoves);
    expect(game.state.status).toEqual(status);
    if (winner) {
      expect(game.state.winner).toEqual(winner.id);
    } else {
      expect(game.state.winner).toBeUndefined();
    }
    if (player1) {
      expect(game.state.x).toBe(player1.id);
    } else {
      expect(game.state.x).toBeUndefined();
    }
    if (player2) {
      expect(game.state.o).toBe(player2.id);
    } else {
      expect(game.state.o).toBeUndefined();
    }
  }

  describe('[T1.1] _join', () => {
    describe('When the player can be added', () => {
      it('makes the first player X and initializes the state with status WAITING_TO_START', () => {
        const player = createPlayerForTesting();

        game.join(player);

        ensureStateIsAsExpected(player, undefined, undefined, 0, 'WAITING_TO_START');
      });
      it('makes the second player O and initializes the state with status IN_PROGRESS', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();

        game.join(player1);
        game.join(player2);

        ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');
      });
    });
    describe('When the player cannot be added', () => {
      it('makes sure the same player cannot join the game twice', () => {
        const player = createPlayerForTesting();

        game.join(player);

        expect(() => game.join(player)).toThrow(InvalidParametersError);
        expect(() => game.join(player)).toThrow(PLAYER_ALREADY_IN_GAME_MESSAGE);

        ensureStateIsAsExpected(player, undefined, undefined, 0, 'WAITING_TO_START');
      });
      it('makes sure that a player cannot join the game if it is full', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        const player3 = createPlayerForTesting();

        game.join(player1);
        game.join(player2);

        expect(() => game.join(player3)).toThrow(InvalidParametersError);
        expect(() => game.join(player3)).toThrow(GAME_FULL_MESSAGE);

        ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');
      });
    });
    describe('[T1.2] _leave', () => {
      describe('when the player is in the game', () => {
        describe('when the game is in progress, it should set the game status to OVER and declare the other player the winner', () => {
          test('when x leaves', () => {
            const player1 = createPlayerForTesting();
            const player2 = createPlayerForTesting();

            game.join(player1);
            game.join(player2);

            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

            game.leave(player1);

            ensureStateIsAsExpected(player1, player2, player2, 0, 'OVER');
          });
          test('when o leaves', () => {
            const player1 = createPlayerForTesting();
            const player2 = createPlayerForTesting();

            game.join(player1);
            game.join(player2);

            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

            game.leave(player2);

            ensureStateIsAsExpected(player1, player2, player1, 0, 'OVER');
          });
        });
        describe('when the game is not in progress it should remove the player', () => {
          test('when only player leaves should set status to WAITING_TO_START', () => {
            const player = createPlayerForTesting();

            game.join(player);

            ensureStateIsAsExpected(player, undefined, undefined, 0, 'WAITING_TO_START');

            game.leave(player);

            ensureStateIsAsExpected(undefined, undefined, undefined, 0, 'WAITING_TO_START');
          });
          test('when someone has won the game, loser leaves', () => {
            const player1 = createPlayerForTesting();
            const player2 = createPlayerForTesting();

            game.join(player1);
            game.join(player2);

            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

            const move1: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 2, col: 2, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 1, col: 0, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 2, col: 1, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 2, col: 0, gamePiece: 'X' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });

            ensureStateIsAsExpected(player1, player2, player1, 5, 'OVER');

            game.leave(player2);

            ensureStateIsAsExpected(player1, player2, player1, 5, 'OVER');
          });
        });
      });
      describe('when the player is not in the game', () => {
        test('when the game is in progress and player not in game tries to leave', () => {
          const player1 = createPlayerForTesting();
          const player2 = createPlayerForTesting();
          const player3 = createPlayerForTesting();

          game.join(player1);
          game.join(player2);

          ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

          expect(() => game.leave(player3)).toThrow(InvalidParametersError);
          expect(() => game.leave(player3)).toThrow(PLAYER_NOT_IN_GAME_MESSAGE);
        });
        test('when the game is not in progress and player not in game tries to leave', () => {
          const player1 = createPlayerForTesting();
          const player2 = createPlayerForTesting();

          game.join(player1);

          ensureStateIsAsExpected(player1, undefined, undefined, 0, 'WAITING_TO_START');

          expect(() => game.leave(player2)).toThrow(InvalidParametersError);
          expect(() => game.leave(player2)).toThrow(PLAYER_NOT_IN_GAME_MESSAGE);
        });
      });
    });
    describe('applyMove', () => {
      describe('when given a valid move', () => {
        let player1: Player;
        let player2: Player;
        beforeEach(() => {
          player1 = createPlayerForTesting();
          player2 = createPlayerForTesting();
          game.join(player1);
          game.join(player2);
        });
        it('[T2.1] should add the move to the game state', () => {
          ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

          const move: TicTacToeMove = { row: 1, col: 2, gamePiece: 'X' };

          game.applyMove({ gameID: game.id, playerID: player1.id, move });

          expect(game.state.moves).toHaveLength(1);
          expect(game.state.moves[0]).toEqual(move);
          expect(game.state.status).toEqual('IN_PROGRESS');
          expect(game.state.x).toBe(player1.id);
          expect(game.state.o).toBe(player2.id);
        });
        describe('that is a winning move', () => {
          it('should check for row 0 win x', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

            const move1: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 2, col: 0, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 0, col: 1, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 2, col: 1, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });

            ensureStateIsAsExpected(player1, player2, player1, 5, 'OVER');
          });
          it('should check for row 0 win o', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

            const move1: TicTacToeMove = { row: 1, col: 1, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 0, col: 0, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 1, col: 2, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 2, col: 2, gamePiece: 'X' };
            const move6: TicTacToeMove = { row: 0, col: 2, gamePiece: 'O' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move6 });

            ensureStateIsAsExpected(player1, player2, player2, 6, 'OVER');
          });
          it('should check for row 1 win x', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

            const move1: TicTacToeMove = { row: 1, col: 0, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 2, col: 0, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 1, col: 1, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 2, col: 1, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 1, col: 2, gamePiece: 'X' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });

            ensureStateIsAsExpected(player1, player2, player1, 5, 'OVER');
          });
          it('should check for row 1 win o', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

            const move1: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 1, col: 0, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 0, col: 1, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 1, col: 1, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 2, col: 2, gamePiece: 'X' };
            const move6: TicTacToeMove = { row: 1, col: 2, gamePiece: 'O' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move6 });

            ensureStateIsAsExpected(player1, player2, player2, 6, 'OVER');
          });
          it('should check for row 2 win o', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

            const move1: TicTacToeMove = { row: 1, col: 0, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 2, col: 0, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 1, col: 1, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 2, col: 1, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
            const move6: TicTacToeMove = { row: 2, col: 2, gamePiece: 'O' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move6 });

            ensureStateIsAsExpected(player1, player2, player2, 6, 'OVER');
          });
          it('should check for row 2 win x', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

            const move1: TicTacToeMove = { row: 2, col: 0, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 1, col: 0, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 2, col: 1, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 1, col: 1, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 2, col: 2, gamePiece: 'X' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });

            ensureStateIsAsExpected(player1, player2, player1, 5, 'OVER');
          });
          it('should check for col 0 win x', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

            const move1: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 2, col: 2, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 1, col: 0, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 2, col: 1, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 2, col: 0, gamePiece: 'X' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });

            ensureStateIsAsExpected(player1, player2, player1, 5, 'OVER');
          });
          it('should check for col 0 win o', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

            const move1: TicTacToeMove = { row: 2, col: 1, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 0, col: 0, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 1, col: 1, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 1, col: 0, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 1, col: 2, gamePiece: 'X' };
            const move6: TicTacToeMove = { row: 2, col: 0, gamePiece: 'O' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move6 });

            ensureStateIsAsExpected(player1, player2, player2, 6, 'OVER');
          });
          it('should check for col 1 win o', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

            const move1: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 2, col: 1, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 1, col: 2, gamePiece: 'X' };
            const move6: TicTacToeMove = { row: 1, col: 1, gamePiece: 'O' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move6 });

            ensureStateIsAsExpected(player1, player2, player2, 6, 'OVER');
          });
          it('should check for col 1 win x', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');
            const move1: TicTacToeMove = { row: 0, col: 1, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 1, col: 2, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 1, col: 1, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 2, col: 2, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 2, col: 1, gamePiece: 'X' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });

            ensureStateIsAsExpected(player1, player2, player1, 5, 'OVER');
          });
          it('should check for col 2 win x', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');
            const move1: TicTacToeMove = { row: 2, col: 2, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 2, col: 0, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 2, col: 1, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 1, col: 2, gamePiece: 'X' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });

            ensureStateIsAsExpected(player1, player2, player1, 5, 'OVER');
          });
          it('should check for col 2 win o', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');
            const move1: TicTacToeMove = { row: 2, col: 1, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 0, col: 2, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 1, col: 1, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 1, col: 2, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 1, col: 0, gamePiece: 'X' };
            const move6: TicTacToeMove = { row: 2, col: 2, gamePiece: 'O' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move6 });

            ensureStateIsAsExpected(player1, player2, player2, 6, 'OVER');
          });
          it('should check for diag 1 win x', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');
            const move1: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 2, col: 0, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 1, col: 1, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 2, col: 1, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 2, col: 2, gamePiece: 'X' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });

            ensureStateIsAsExpected(player1, player2, player1, 5, 'OVER');
          });
          it('should check for diag 1 win o', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');
            const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 0, col: 0, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 1, col: 2, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 1, col: 1, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 1, col: 0, gamePiece: 'X' };
            const move6: TicTacToeMove = { row: 2, col: 2, gamePiece: 'O' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move6 });

            ensureStateIsAsExpected(player1, player2, player2, 6, 'OVER');
          });
          it('should check for diag 2 win for o', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');
            const move1: TicTacToeMove = { row: 2, col: 1, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 0, col: 2, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 0, col: 1, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 1, col: 1, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 1, col: 2, gamePiece: 'X' };
            const move6: TicTacToeMove = { row: 2, col: 0, gamePiece: 'O' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move6 });

            ensureStateIsAsExpected(player1, player2, player2, 6, 'OVER');
          });
          it('should check for diag 2 win for x', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');
            const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 1, col: 1, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 1, col: 2, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 2, col: 0, gamePiece: 'X' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });

            ensureStateIsAsExpected(player1, player2, player1, 5, 'OVER');
          });
          it('should check for a tie', () => {
            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');
            const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };
            const move3: TicTacToeMove = { row: 1, col: 1, gamePiece: 'X' };
            const move4: TicTacToeMove = { row: 1, col: 0, gamePiece: 'O' };
            const move5: TicTacToeMove = { row: 1, col: 2, gamePiece: 'X' };
            const move6: TicTacToeMove = { row: 2, col: 0, gamePiece: 'O' };
            const move7: TicTacToeMove = { row: 2, col: 1, gamePiece: 'X' };
            const move8: TicTacToeMove = { row: 2, col: 2, gamePiece: 'O' };
            const move9: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move5 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move6 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move7 });
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move8 });
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move9 });

            ensureStateIsAsExpected(player1, player2, undefined, 9, 'OVER');
          });
        });
      });
      describe('when given an invalid move', () => {
        let player1: Player;
        let player2: Player;
        beforeEach(() => {
          player1 = createPlayerForTesting();
          player2 = createPlayerForTesting();
          game.join(player1);
        });
        test('if the player is not in the game and goes with x', () => {
          const player3 = createPlayerForTesting();

          game.join(player2);

          ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

          const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player3.id, move: move1 }),
          ).toThrow(MOVE_NOT_YOUR_TURN_MESSAGE);
        });
        it('should not change whos turn it is (out of turn move by o)', () => {
          game.join(player2);

          ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

          const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'O' };
          const move2: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move1 }),
          ).toThrow(InvalidParametersError);
          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move1 }),
          ).toThrow(MOVE_NOT_YOUR_TURN_MESSAGE);

          game.applyMove({ gameID: game.id, playerID: player1.id, move: move2 });

          ensureStateIsAsExpected(player1, player2, undefined, 1, 'IN_PROGRESS');
        });
        it('should not change whos turn it is (out of turn move by x)', () => {
          game.join(player2);

          ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

          const move0: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };
          const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
          const move2: TicTacToeMove = { row: 0, col: 1, gamePiece: 'X' };
          const move3: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };
          const move4: TicTacToeMove = { row: 2, col: 1, gamePiece: 'O' };

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move0 }),
          ).toThrow(InvalidParametersError);

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move0 }),
          ).toThrow(MOVE_NOT_YOUR_TURN_MESSAGE);

          game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move2 }),
          ).toThrow(InvalidParametersError);

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move2 }),
          ).toThrow(MOVE_NOT_YOUR_TURN_MESSAGE);

          game.applyMove({ gameID: game.id, playerID: player2.id, move: move3 });

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 }),
          ).toThrow(InvalidParametersError);

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 }),
          ).toThrow(MOVE_NOT_YOUR_TURN_MESSAGE);

          ensureStateIsAsExpected(player1, player2, undefined, 2, 'IN_PROGRESS');
        });
        it('should not change whos turn it is (space occupied move o on x)', () => {
          game.join(player2);

          ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

          const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
          const move2: TicTacToeMove = { row: 0, col: 2, gamePiece: 'O' };
          const move3: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };

          game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 }),
          ).toThrow(InvalidParametersError);

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 }),
          ).toThrow(BOARD_POSITION_NOT_EMPTY_MESSAGE);

          game.applyMove({ gameID: game.id, playerID: player2.id, move: move3 });

          ensureStateIsAsExpected(player1, player2, undefined, 2, 'IN_PROGRESS');
        });
        it('should not change whos turn it is (space occupied move o on o)', () => {
          game.join(player2);

          ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

          const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
          const move2: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };
          const move3: TicTacToeMove = { row: 1, col: 1, gamePiece: 'X' };
          const move4: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };
          const move5: TicTacToeMove = { row: 2, col: 1, gamePiece: 'O' };

          game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
          game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });
          game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 });
          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 }),
          ).toThrow(InvalidParametersError);
          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move4 }),
          ).toThrow(BOARD_POSITION_NOT_EMPTY_MESSAGE);

          game.applyMove({ gameID: game.id, playerID: player2.id, move: move5 });

          ensureStateIsAsExpected(player1, player2, undefined, 4, 'IN_PROGRESS');
        });
        it('should not change whos turn it is (space occupied move x on o)', () => {
          game.join(player2);

          ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

          const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
          const move2: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };
          const move3: TicTacToeMove = { row: 0, col: 1, gamePiece: 'X' };
          const move4: TicTacToeMove = { row: 2, col: 0, gamePiece: 'X' };

          game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });

          game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 }),
          ).toThrow(InvalidParametersError);

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 }),
          ).toThrow(BOARD_POSITION_NOT_EMPTY_MESSAGE);

          game.applyMove({ gameID: game.id, playerID: player1.id, move: move4 });

          ensureStateIsAsExpected(player1, player2, undefined, 3, 'IN_PROGRESS');
        });
        it('should not change whos turn it is (space occupied move x on x)', () => {
          game.join(player2);

          ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

          const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
          const move2: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };
          const move3: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
          const move4: TicTacToeMove = { row: 1, col: 2, gamePiece: 'X' };

          game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });

          game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 }),
          ).toThrow(InvalidParametersError);

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move3 }),
          ).toThrow(BOARD_POSITION_NOT_EMPTY_MESSAGE);

          game.applyMove({ gameID: game.id, playerID: player1.id, move: move4 });

          ensureStateIsAsExpected(player1, player2, undefined, 3, 'IN_PROGRESS');
        });
        it('should not change whos turn it is (incorrect playerID move when player2 tries to go with x)', () => {
          game.join(player2);

          ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

          const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move1 }),
          ).toThrow(InvalidParametersError);
          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move1 }),
          ).toThrow(MOVE_NOT_YOUR_TURN_MESSAGE);

          game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });

          ensureStateIsAsExpected(player1, player2, undefined, 1, 'IN_PROGRESS');
        });
        it('should not change whos turn it is (incorrect playerID move when player1 tries to go with O)', () => {
          game.join(player2);

          ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

          const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
          const move2: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };

          game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });
          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move2 }),
          ).toThrow(InvalidParametersError);
          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move2 }),
          ).toThrow(MOVE_NOT_YOUR_TURN_MESSAGE);

          game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 });

          ensureStateIsAsExpected(player1, player2, undefined, 2, 'IN_PROGRESS');
        });
        describe('when the game is not in progress (over status)', () => {
          it('should throw an error when x moves`', () => {
            game.join(player2);

            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

            game.leave(player2);

            const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };

            expect(() =>
              game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 }),
            ).toThrow(InvalidParametersError);
            expect(() =>
              game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 }),
            ).toThrow(GAME_NOT_IN_PROGRESS_MESSAGE);

            ensureStateIsAsExpected(player1, player2, player1, 0, 'OVER');
          });
          it('should throw an error when o moves`', () => {
            game.join(player2);

            ensureStateIsAsExpected(player1, player2, undefined, 0, 'IN_PROGRESS');

            const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
            const move2: TicTacToeMove = { row: 1, col: 2, gamePiece: 'O' };

            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });

            game.leave(player1);

            expect(() =>
              game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 }),
            ).toThrow(GAME_NOT_IN_PROGRESS_MESSAGE);
            expect(() =>
              game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 }),
            ).toThrow(GAME_NOT_IN_PROGRESS_MESSAGE);

            ensureStateIsAsExpected(player1, player2, player2, 1, 'OVER');
          });
        });
        describe('when the game is not in progress (waiting status)', () => {
          it('should throw an error when x moves', () => {
            const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };

            expect(() =>
              game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 }),
            ).toThrow(InvalidParametersError);
            expect(() =>
              game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 }),
            ).toThrow(GAME_NOT_IN_PROGRESS_MESSAGE);

            ensureStateIsAsExpected(player1, undefined, undefined, 0, 'WAITING_TO_START');
          });
        });
      });
    });
  });
});

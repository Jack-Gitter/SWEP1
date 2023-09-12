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
import { TicTacToeMove } from '../../types/CoveyTownSocket';
import TicTacToeGame from './TicTacToeGame';

describe('TicTacToeGame', () => {
  let game: TicTacToeGame;

  beforeEach(() => {
    game = new TicTacToeGame();
  });

  describe('[T1.1] _join', () => {
    describe('When the player can be added', () => {
      it('makes the first player X and initializes the state with status WAITING_TO_START', () => {
        const player = createPlayerForTesting();

        game.join(player);

        expect(game.state.x).toEqual(player.id);
        expect(game.state.o).toBeUndefined();
        expect(game.state.moves).toHaveLength(0);
        expect(game.state.status).toEqual('WAITING_TO_START');
        expect(game.state.winner).toBeUndefined();
      });
      it('makes the second player O and initializes the state with status IN_PROGRESS', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();

        game.join(player1);
        game.join(player2);

        expect(game.state.x).toEqual(player1.id);
        expect(game.state.o).toEqual(player2.id);
        expect(game.state.moves).toHaveLength(0);
        expect(game.state.winner).toBeUndefined();
        expect(game.state.status === 'IN_PROGRESS');
      });
    });
    describe('When the player cannot be added', () => {
      it('makes sure the same player cannot join the game twice', () => {
        const player = createPlayerForTesting();

        game.join(player);

        expect(() => game.join(player)).toThrow(InvalidParametersError);
        expect(() => game.join(player)).toThrow(PLAYER_ALREADY_IN_GAME_MESSAGE);
      });
      it('makes sure that a player cannot join the game if it is full', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        const player3 = createPlayerForTesting();

        game.join(player1);
        game.join(player2);

        expect(() => game.join(player3)).toThrow(InvalidParametersError);
        expect(() => game.join(player3)).toThrow(GAME_FULL_MESSAGE);
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

            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);

            game.leave(player1);

            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player2.id);
            expect(game.state.moves).toHaveLength(0);
            expect(game.state.x).toEqual(player1.id); // this is intentional???
            expect(game.state.o).toEqual(player2.id);
          });
          test('when o leaves', () => {
            const player1 = createPlayerForTesting();
            const player2 = createPlayerForTesting();

            game.join(player1);
            game.join(player2);

            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);

            game.leave(player2);

            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player1.id);
            expect(game.state.moves).toHaveLength(0);
            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);
          });
        });
        describe('when the game is not in progress it should remove the player and set status to WAITING_TO_START', () => {
          test('when only player leaves', () => {
            const player = createPlayerForTesting();

            game.join(player);

            expect(game.state.x).toEqual(player.id);
            expect(game.state.status).toEqual('WAITING_TO_START');

            game.leave(player);

            expect(game.state.status).toEqual('WAITING_TO_START');
            expect(game.state.x).toBeUndefined();
          });
          test('when someone has won the game', () => {
            const player1 = createPlayerForTesting();
            const player2 = createPlayerForTesting();

            game.join(player1);
            game.join(player2);
            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);
            expect(game.state.status).toEqual('IN_PROGRESS');

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

            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player1.id);

            game.leave(player2);

            expect(game.state.status).toEqual('OVER');
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

          expect(() => game.leave(player3)).toThrow(InvalidParametersError);
          expect(() => game.leave(player3)).toThrow(PLAYER_NOT_IN_GAME_MESSAGE);
        });
        test('when the game is not in progress and player not in game tries to leave', () => {
          const player1 = createPlayerForTesting();
          const player2 = createPlayerForTesting();

          game.join(player1);

          expect(game.state.status === 'WAITING_TO_START');
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
          const move: TicTacToeMove = { row: 1, col: 2, gamePiece: 'X' };

          game.applyMove({ gameID: game.id, playerID: player1.id, move });

          expect(game.state.moves).toHaveLength(1);
          expect(game.state.moves[0]).toEqual(move);
          expect(game.state.status).toEqual('IN_PROGRESS');
        });
        describe('that is a winning move', () => {
          it('should check for row 0 win', () => {
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

            expect(game.state.moves).toHaveLength(5);
            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player1.id);
          });
          it('should check for row 1 win', () => {
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

            expect(game.state.moves).toHaveLength(5);
            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player1.id);
          });
          it('should check for row 2 win', () => {
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

            expect(game.state.moves).toHaveLength(6);
            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player2.id);
          });
          it('should check for col 0 win', () => {
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

            expect(game.state.moves).toHaveLength(5);
            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player1.id);
          });
          it('should check for col 1 win', () => {
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

            expect(game.state.moves).toHaveLength(6);
            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player2.id);
          });
          it('should check for col 2 win', () => {
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

            expect(game.state.moves).toHaveLength(5);
            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player1.id);
          });
          it('should check for diag 1 win', () => {
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

            expect(game.state.moves).toHaveLength(5);
            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player1.id);
          });
          it('should check for diag 2 win', () => {
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

            expect(game.state.moves).toHaveLength(6);
            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player2.id);
          });
          it('should check for a tie', () => {
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

            expect(game.state.moves).toHaveLength(9);
            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(undefined);
          });
        });
      });
      describe('when it is an invalid move', () => {
        let player1: Player;
        let player2: Player;
        beforeEach(() => {
          player1 = createPlayerForTesting();
          player2 = createPlayerForTesting();
          game.join(player1);
        });
        it('should not change whos turn it is', () => {
          game.join(player2);

          const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'O' };
          const move2: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move1 }),
          ).toThrow(InvalidParametersError);
          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move1 }),
          ).toThrow(MOVE_NOT_YOUR_TURN_MESSAGE);

          game.applyMove({ gameID: game.id, playerID: player1.id, move: move2 });

          expect(game.state.status === 'IN_PROGRESS');
          expect(game.state.moves).toHaveLength(1);
        });
        it('should use playerID to determine whos turn it is', () => {
          game.join(player2);

          const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move1 }),
          ).toThrow(InvalidParametersError);

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move1 }),
          ).toThrow(MOVE_NOT_YOUR_TURN_MESSAGE);
        });
        it('should stop a player from going twice in a row', () => {
          game.join(player2);

          const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
          const move2: TicTacToeMove = { row: 0, col: 1, gamePiece: 'X' };

          game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move2 }),
          ).toThrow(InvalidParametersError);
          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move2 }),
          ).toThrow(MOVE_NOT_YOUR_TURN_MESSAGE);
          expect(game.state.moves).toHaveLength(1);
          expect(game.state.status).toEqual('IN_PROGRESS');
        });
        it('should check that the space is occupied', () => {
          game.join(player2);

          const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };
          const move2: TicTacToeMove = { row: 0, col: 2, gamePiece: 'O' };

          game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 });

          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 }),
          ).toThrow(InvalidParametersError);
          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player2.id, move: move2 }),
          ).toThrow(BOARD_POSITION_NOT_EMPTY_MESSAGE);

          expect(game.state.moves).toHaveLength(1);
          expect(game.state.status).toEqual('IN_PROGRESS');
        });
        describe('when the game is not in progress (over status)', () => {
          it('should throw an error', () => {
            game.join(player2);
            game.leave(player2);

            const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };

            expect(() =>
              game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 }),
            ).toThrow(InvalidParametersError);
            expect(() =>
              game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 }),
            ).toThrow(GAME_NOT_IN_PROGRESS_MESSAGE);
            expect(game.state.moves).toHaveLength(0);
            expect(game.state.status).toEqual('OVER');
          });
        });
        describe('when the game is not in progress (waiting status)', () => {
          it('should throw an error', () => {
            const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'X' };

            expect(() =>
              game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 }),
            ).toThrow(InvalidParametersError);
            expect(() =>
              game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 }),
            ).toThrow(GAME_NOT_IN_PROGRESS_MESSAGE);
            expect(game.state.moves).toHaveLength(0);
            expect(game.state.status).toEqual('WAITING_TO_START');
          });
        });
        it('should throw an error if the move is not valid', () => {
          const move1: TicTacToeMove = { row: 0, col: 2, gamePiece: 'O' };
          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 }),
          ).toThrow(InvalidParametersError);
          expect(() =>
            game.applyMove({ gameID: game.id, playerID: player1.id, move: move1 }),
          ).toThrow(GAME_NOT_IN_PROGRESS_MESSAGE);
        });
      });
    });
  });
});

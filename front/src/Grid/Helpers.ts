// import { CellGrid } from "./Grid";
// import { CELL_STATE } from "../Cell/constants";
// import Cell from "../Cell/Cell";
//
// class GridHelpers {
//     public static createCells(
//       ctx: CanvasRenderingContext2D,
//       cellsMatrix,
//       drawCell,
//       grid,
//       data?: CellGrid,
//       isBlank: boolean = false
//     ) {
//       if (data && data[0][0].state === CELL_STATE.OUTSIDE) {
//         drawCell(ctx, data[0][0], -1, -1);
//       } else {
//         let tmpCell: Cell;
//         // flush this._cellMatrix at each mousemove to prevent to grow undefinitey in size
//         if (cellsMatrix.length > 0) cellsMatrix = [];
//         for (let i = 0; i < grid.gridSize; i++) {
//           cellsMatrix.push([]);
//           for (let j = 0; j < grid.gridSize; j++) {
//             if (data) {
//               tmpCell = data[i][j];
//             } else if (isBlank) {
//               tmpCell = new Cell(CELL_STATE.DEAD);
//             } else {
//               tmpCell = new Cell();
//             }
//             cellsMatrix[i].push(tmpCell);
//             console.log('helper ctx', ctx);
//             drawCell(ctx, tmpCell, i, j);
//           }
//         }
//       }
//     }
// }
//
// export default GridHelpers;

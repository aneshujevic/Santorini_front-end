import React from 'react';
import axios from 'axios';
import Square from './square';

const getAvailableMovesURL = "http://127.0.0.1:8000/getAvailableMoves/";
const getAvailableBuildsURL = "http://127.0.0.1:8000/getAvailableBuilds/";
const getMoveMinmaxAI = "http://127.0.0.1:8000/minmax/";
const getMoveAlphaBetaAI = "http://127.0.0.1:8000/alphaBeta/";
const getMoveAlphaBetaCustomAI = "http://127.0.0.1:8000/alphaBetaCustom/";

class Board extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            cells: Array(25).fill(0),
            firstHE: [0, 0],
            secondHE: [0, 4],
            firstJU: [4, 0],
            secondJU: [4, 4],
            availableMovesOrBuilds: [],
        };
        this.humanPlayer = props.human;
        this.chooseMove = false;
        this.moving = false;
        this.building = false;
        this.lastClickedId = -1;
        this.upperBoundCellValue = this.humanPlayer === "JU" ? 12 : 8;
        this.lowerBoundCellValue = this.humanPlayer === "JU" ? 9 : 5;
        this.setupBuilders();

        // test
        this.state.cells[0] = 9;
        this.state.firstHE = [0, 0]
        this.state.availableMovesOrBuilds = [[0, 1], [0, 2], [0, 3]];
    }

    setupBuilders() {
        // choose 2 cells for each builder
    }

    render() {
        const sources = this.state.cells.map((square) => this.getImageSourceCell(square));
        return (
            <div className="board">
                <div className="board-row">
                    {this.renderSquare(sources[0], 0)}
                    {this.renderSquare(sources[1], 1)}
                    {this.renderSquare(sources[2], 2)}
                    {this.renderSquare(sources[3], 3)}
                    {this.renderSquare(sources[4], 4)}
                </div>
                <div className="board-row">
                    {this.renderSquare(sources[5], 5)}
                    {this.renderSquare(sources[6], 6)}
                    {this.renderSquare(sources[7], 7)}
                    {this.renderSquare(sources[8], 8)}
                    {this.renderSquare(sources[9], 9)}
                </div>
                <div className="board-row">
                    {this.renderSquare(sources[10], 10)}
                    {this.renderSquare(sources[11], 11)}
                    {this.renderSquare(sources[12], 12)}
                    {this.renderSquare(sources[13], 13)}
                    {this.renderSquare(sources[14], 14)}
                </div>
                <div className="board-row">
                    {this.renderSquare(sources[15], 15)}
                    {this.renderSquare(sources[16], 16)}
                    {this.renderSquare(sources[17], 17)}
                    {this.renderSquare(sources[18], 18)}
                    {this.renderSquare(sources[19], 19)}
                </div>
                <div className="board-row">
                    {this.renderSquare(sources[20], 20)}
                    {this.renderSquare(sources[21], 21)}
                    {this.renderSquare(sources[22], 22)}
                    {this.renderSquare(sources[23], 23)}
                    {this.renderSquare(sources[24], 24)}
                </div>
            </div>
        );
    }

    renderSquare(source, idOfCell) {
        const glowing = this.state.availableMovesOrBuilds?.find(x => x === idOfCell) != null ? true : false;
        return (
            <Square
                src={`../images/${source}`}
                onClick={() => this.clickHandle(idOfCell)}
                glowing={glowing}
            />
        );
    }

    // Choosing a path for the image source for the appropriate value
    getImageSourceCell(i) {
        switch (i) {
            case 0:
                return "lvl_0.jpg";
            case 1:
                return "lvl_1.png";
            case 2:
                return "lvl_2.png";
            case 3:
                return "lvl_3.png";
            case 4:
                return "lvl_4.png";
            case 5:
                return "hercules.png";
            case 6:
                return "lvl_1_HE.png";
            case 7:
                return "lvl_2_HE.png";
            case 8:
                return "lvl_3_HE.png";
            case 9:
                return "jupiter.png";
            case 10:
                return "lvl_1_JU.png";
            case 11:
                return "lvl_2_JU.png";
            case 12:
                return "lvl_3_JU.png";
            default:
                return "";
        }
    }

    clickHandle(idOfCell) {
        // If we clicked on a builder
        if (this.lowerBoundCellValue <= this.state.cells[idOfCell] && this.state.cells[idOfCell] <= this.upperBoundCellValue) {
            // If we weren't moving, that is a builder is being selected
            if (this.moving === false && idOfCell !== this.lastClickedId && this.lastClickedId === -1) {
                this.lastClickedId = idOfCell;
                this.chooseMove = true;
            }
            // If we're undo-ing the selection of builder
            else if (idOfCell === this.lastClickedId) {
                this.chooseMove = false;
                this.moving = false;
                this.lastClickedId = -1;
                this.setState({ availableMovesOrBuilds: null });
            }
        }

        // If we selected a builder then we're in a phase of choosing where to move, builder can still be de-selected
        if (this.chooseMove === true) {
            if (this.lastClickedId === idOfCell)
                this.setupAvailableMoves(idOfCell, getAvailableMovesURL);
            else {
                this.chooseMove = false;
                this.moving = true;
            }
            // make a request for available moves 
            // make a converter to python - implemented game
        }

        // If we decided to move to a certain field and that field is in the list of allowed moves
        if (this.building === true && this.state.availableMovesOrBuilds.find(x => x === idOfCell) != null) {
            this.buildBlock(idOfCell);
            this.building = false;
            this.setState({availableMovesOrBuilds: null});
        }

        // If we decided to move to a certain field and that field is in the list of allowed moves
        if (this.moving === true && this.state.availableMovesOrBuilds.find(x => x === idOfCell) != null) {
            this.moveFigure(this.lastClickedId, idOfCell);
            this.lastClickedId = -1;
            this.moving = false;
            this.building = true;
            this.setupAvailableMoves(idOfCell, getAvailableBuildsURL);
            // make a request for available builds
        }
    }

    setupAvailableMoves(selectedCoordinate, url) {
        this.getMovesFromServer(selectedCoordinate, url).
            then((arrayOfMoves) => this.setState({ availableMovesOrBuilds: arrayOfMoves }));
    }

    async getMovesFromServer(selectedCoordinate, url) {
        const data = [{
            cells: this.state.cells.slice().map(x => x % 5),
            firstHE: this.state.firstHE.slice(),
            secondHE: this.state.secondHE.slice(),
            firstJU: this.state.firstJU.slice(),
            secondJU: this.state.secondJU.slice(),
            startPosition: [Math.floor(selectedCoordinate / 5), selectedCoordinate % 5],
        }];
        const response = await axios.
            post(url, data).
            catch((err) => { console.log(err) });
        return response.data.moves.map(x => x[0] * 5 + x[1]);
    }

    makeRequest() {
        // make requests for available moves, builds, algorithms and AI builders' setup
    }

    // Pravimo blok
    buildBlock(onCell) {
        const cells = this.state.cells.slice();
        cells[onCell] += 1;
        this.setState({
            cells: cells,
        });
    }

    // Moving a figure
    // TODO: note the changes of figure in state, maybe when setting up things then doing the changes here too?
    moveFigure(fromCell, toCell) {
        let multiplier = Math.floor((this.state.cells[fromCell] + 1) / 5);
        const cells = this.state.cells.slice();
        cells[fromCell] = (cells[fromCell] + 1) % 5;
        cells[toCell] = 5 * multiplier + cells[toCell] - 1;
        // HERE IS A BUG PLEASE STOP
        this.setState({
            cells: cells,
        }, console.log(this.state.cells));
    }

}

export default Board;
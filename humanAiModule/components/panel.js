import React from 'react';

function Panel(props) {
    if (props.side === "left")
        return (
            <div className={props.class}>
                <a href="http://127.0.0.1:8000/home">
                    <img id="back-img" width="100em" height="100em" src="../images/back-button.png" alt="back-button"></img>
                </a>
                <div className="text">
                <ol>
                    <em><h3>Instructions</h3></em>
                    <li><b>Click</b> on the two of available fields to set builder</li>
                    <li><b>Click</b> on one builder to select, move and build with him on one of the highlighted fields</li>
                    <li><em><b>Goal</b> is to get to the third floor, good luck!</em></li>
                </ol>
                </div>
            </div>
        );
    else
        return (
            <div className={props.class}>
                <div className="algorithm-box">
                    <fieldset>
                        <legend>
                            <em>Algorithm</em>
                        </legend>
                        <select id="algorithm">
                            <option value="minimax">Minimax</option>
                            <option value="ab">α - β</option>
                            <option selected value="ab-enhanced">α - β enhanced</option>
                        </select>
                        <button className="algorithm-button" onClick={props.algorithmFun}>
                            Choose algorithm
                    </button>
                    </fieldset>
                    <fieldset>
                        <legend>
                            <em>Depth</em> <b><span id="graph-depth">4</span></b>
                        </legend>
                        <button className="algorithm-button" onClick={props.increaseFun}>+</button>
                        &nbsp;
                        <button className="algorithm-button" onClick={props.decreaseFun}>-</button>
                    </fieldset>
                </div>
                <div className="text">
                </div>
            </div>
        );
}

export default Panel;
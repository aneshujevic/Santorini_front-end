import React from 'react';

class Panel extends React.Component {
    connectButtonInput() {
        const inputFile = document.getElementById("upload-file");
        inputFile.click();
    }

    render() {
        if (this.props.side === "left")
            return (
                <div className={this.props.class}>
                    <a href="http://127.0.0.1:8000/home">
                        <img id="back-img" width="100em" height="100em" src="/static/images/back-button.png" alt="back-button"></img>
                    </a>
                    <div className="text-div">
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
                <div className={this.props.class}>
                    <div className="text-div">
                        <button onClick={() => this.connectButtonInput()} className="algorithm-button">Import</button>
                        <input id="upload-file" onChange={this.props.importState} type="file" hidden></input>
                        &nbsp;
                        <button onClick={this.props.exportState} className="algorithm-button">Export</button>
                        <br /><br />
                        <span> <em>Moves:</em> </span> <br /> <br />
                        <div id="moves">

                        </div>
                    </div>
                </div>
            );
    }
}

export default Panel;

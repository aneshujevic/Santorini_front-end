import React from 'react';
import Card from './menu-card';

class Menu extends React.Component {
    render () {
        return (
        <ul className="menu">
            <span className="menu-header">Menu</span>
            {this.renderCard("-- Human versus human --", "http://127.0.0.1:8000/humanhuman")}
            {this.renderCard("-- Human versus AI --", "http://127.0.0.1:8000/humanai")}
            {this.renderCard("-- AI versus AI --", "http://127.0.0.18000/aiai")}
        </ul>
        );
    }

    renderCard(text, link) {
        return (
            <Card text={text} link={link}/>
        );
    }
}

export default Menu;

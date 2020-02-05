import React from 'react';
import Menu from './menu';

function Page (props) {
    return (
        <div className="whole-page">
        <span className="header">Welcome to Santorini</span>
        <Menu />
        </div>
    );
}

export default Page;
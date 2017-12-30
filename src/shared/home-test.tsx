import { expect } from 'chai'
import * as Enzyme from 'enzyme'
import { shallow } from 'enzyme'
import * as Adapter from 'enzyme-adapter-react-16'
import * as React from 'react'
import 'mocha'

import { HomePage } from './home'

Enzyme.configure({adapter: new Adapter()});


describe('HomePage', () => {
    it('should render', () => {
        const wrapper = shallow(<HomePage />);
        expect(wrapper.contains('Home page')).to.be.true;
    });
});

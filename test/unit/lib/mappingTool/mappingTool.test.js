const { expect } = require('chai');

describe('Mapping Tool test', () => {
    it('Should be true', (done) => {
        const variable = true;
        expect(variable).to.equal(true);
        done();
    });
});

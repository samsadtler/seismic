describe("App.js", function() {

  describe("Scale magnitude", function() {
    it("scales 1 to 500 milliseconds", function() {
      expect(scaleMagnitude(1)).toEqual(500);
    });

    it("scales 6.5 to 1750 milliseconds", function() {
      expect(scaleMagnitude(6.5)).toEqual(1750);
    });

    it("scales 12 to 3000 milliseconds", function() {
      expect(scaleMagnitude(12)).toEqual(3000);
    });
  });

  describe("Scale distance", function() {
    it("scales 0 to 0", function() {
      expect(scaleDistance(0)).toEqual(0);
    });

    it("scales 10019000 to 128", function() {
      expect(scaleDistance(10019000)).toEqual(128);
    });

    it("scales 20038000 to 255", function() {
      expect(scaleDistance(20038000)).toEqual(255);
    });
  });

})

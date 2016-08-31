describe("App.js", function() {

  describe("Get most recent quake", function() {
    describe("when there have been quakes in the past hour", function() {
      it("gets the most recent quake", function() {
        var data = { "features": [
            {
              "properties": {
                "mag": 1.5,
                "place": "6km WNW of The Geysers, California",
                "time": 1472583453300
              }
            }
          ]}

        var result = getMostRecentQuake(data);

        expect(result.magnitude).toEqual(1.5);
        expect(result.place).toEqual("6km WNW of The Geysers, California");
        expect(result.time).toEqual(1472583453300);
      });
    });

    describe("when there have not been quakes in the past hour", function() {
      it("returns empty json object", function() {
        var data = { "features": []}

        var result = getMostRecentQuake(data);

        expect(result).toEqual({});
      });
    });
  });

  describe("Scale magnitude to milliseconds", function() {

    it("scales 1 to 500", function() {
      expect(scaleMagnitudeToMilliseconds(1)).toEqual(500);
    });

    it("scales 6.5 to 50", function() {
      expect(scaleMagnitudeToMilliseconds(6.5)).toEqual(1750);
    });

    it("scales 12 to 100", function() {
      expect(scaleMagnitudeToMilliseconds(12)).toEqual(3000);
    });
  });
})

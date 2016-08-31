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

  describe("Scale magnitude", function() {

    it("scales 1 to 500", function() {
      expect(scaleMagnitude(1)).toEqual(500);
    });

    it("scales 6.5 to 1750", function() {
      expect(scaleMagnitude(6.5)).toEqual(1750);
    });

    it("scales 12 to 3000", function() {
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

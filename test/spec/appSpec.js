describe("Get most recent quake", function() {

  describe("when there have been quakes in the past hour", function() {
    it("gets the most recent quake", function() {
      var data = { "features": [
          {
            "properties": {
              "mag": 0.9,
              "place": "6km WNW of The Geysers, California",
              "time": 1472583453300
            }
          }
        ]}

      var result = getMostRecentQuake(data);

      expect(result.magnitude).toEqual(0.9);
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

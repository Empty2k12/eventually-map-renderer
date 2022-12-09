export const areaColor = (way) => {
    if(way.type === "earth" || ["residential", "commercial"].includes(way.properties.landuse)) {
        return 0.9;
    }

    if(way.type === "water" || way.properties.waterway) {
        return 0.85;
    }

    if(way.properties.landuse === "industrial" || way.properties.amenity === "hospital") {
        return 0.55;
    }

    if(way.type === "buildings") {
        return 0.5;
    }

    if(["park", "playground", "pitch", "garden", "dog_park"].includes(way.properties.leisure) || ["grass", "brownfield", "recreation_ground", "cemetery", "farmland", "farmyard"].includes(way.properties.landuse)) {
        return 0.8;
    }

    if(way.properties.amenity === "parking" || ["railway"].includes(way.properties.landuse) || way.properties.railway === "platform") {
        return 0.3;
    }

    if(way.properties.amenity === "school" || way.properties.amenity === "college" || way.properties.amenity === "kindergarten" || way.properties.university === "campus" || way.properties.amenity === "university") {
        return 0.1;
    }

    console.log("uncolored way", way);

    return 1;
}


export const wayColor = (way) => {
    if(["primary", "primary_link"].includes(way.properties.highway)) {
        return [0.98823529, 0.83921569, 0.64313725];
    }

    if(["residential", "secondary", "secondary_link", "tertiary", "tertiary_link", "living_street", "unclassified", "pedestrian"].includes(way.properties.highway)) {
        return [1, 1, 1];
    }

    if(["footway", "steps", "cycleway", "path", "track"].includes(way.properties.highway)) {
        return [0.95294118, 0.60392157, 0.54117647];
    }

    if(way.properties.highway === "service") {
        return [0.85,0.85,0.85];
    }

    if(way.properties.waterway) {
        return [0.666, 0.82745098, 0.8745098];
    }

    return [0,0,0];
}
  
export const wayWidth = (way) => {
    if(["primary"].includes(way.properties.highway)) {
        return 18;
    }

    if(["residential", "secondary", "tertiary", "secondary_link", "tertiary_link", "living_street", "primary_link"].includes(way.properties.highway)) {
        return 12;
    }

    if(["footway", "steps", "path", "track"].includes(way.properties.highway) || way.properties.waterway) {
        return 2;
    }

    if(["service", "pedestrian", "unclassified", "cycleway"].includes(way.properties.highway)) {
        return 7;
    }

    if(way.properties.railway) {
        return 3;
    }

    console.log("uncolored", way);

    return 7;
}
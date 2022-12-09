export const areaColor = (way) => {
    if(way.type === "earth" || ["residential", "commercial"].includes(way.properties.landuse)) {
        return 0.9;
    }

    if(way.type === "water") {
        return 0.8;
    }

    if(way.type === "buildings") {
        return 0.5;
    }

    if(["park", "playground"].includes(way.properties.leisure) || ["grass", "brownfield"].includes(way.properties.landuse)) {
        return 0.8;
    }

    if(way.properties.amenity === "parking" || ["railway"].includes(way.properties.landuse)) {
        return 0.3;
    }

    if(way.properties.amenity === "school" || way.properties.amenity === "kindergarten" || way.properties.university === "campus") {
        return 0.1;
    }

    return 1;
}


export const wayColor = (way) => {
    if(["primary", "primary_link"].includes(way.properties.highway)) {
        return [0.98823529, 0.83921569, 0.64313725];
    }

    if(["residential", "secondary", "tertiary", "tertiary_link", "living_street", "unclassified", "pedestrian"].includes(way.properties.highway)) {
        return [1, 1, 1];
    }

    if(["footway", "steps", "cycleway", "path", "track"].includes(way.properties.highway)) {
        return [0.95294118, 0.60392157, 0.54117647];
    }

    if(way.properties.highway === "service") {
        return [0.85,0.85,0.85];
    }

    if(way.properties.waterway === "stream") {
        return [0.666, 0.82745098, 0.8745098];
    }

    return [0,0,0];
}
  
export const wayWidth = (way) => {
    if(["primary"].includes(way.properties.highway)) {
        return 18;
    }

    if(["residential", "secondary", "tertiary", "tertiary_link", "living_street", "primary_link"].includes(way.properties.highway)) {
        return 12;
    }

    if(["footway", "steps", "path", "track"].includes(way.properties.highway) || way.properties.waterway === "stream") {
        return 2;
    }

    if(["service", "pedestrian"].includes(way.properties.highway)) {
        return 7;
    }

    if(["rail"].includes(way.properties.railway)) {
        return 3;
    }

    return 7;
}
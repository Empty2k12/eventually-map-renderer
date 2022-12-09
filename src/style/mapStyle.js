export const areaColor = (way) => {
    if(way.type === "earth") {
        return 0.9;
    }

    if(way.type === "buildings") {
        return 0.5;
    }

    if(way.properties.leisure === "park" || way.properties.natural === "scrub" || ["grass", "forest"].includes(way.properties.landuse) || ["garden", "pitch"].includes(way.properties.leisure) || way.properties.scrub === "grass") {
        return 0.8;
    }

    if(way.properties.amenity === "parking") {
        return 0.3;
    }

    if(way.properties.amenity === "school" || way.properties.university === "campus") {
        return 0.1;
    }

    return 1;
}


export const wayColor = (way) => {
    if(["primary", "primary_link"].includes(way.tags.highway)) {
        return [0.98823529, 0.83921569, 0.64313725];
    }

    if(["residential", "secondary", "tertiary", "tertiary_link", "living_street", "unclassified", "pedestrian"].includes(way.tags.highway)) {
        return [1, 1, 1];
    }

    if(["footway", "steps", "cycleway", "path", "track"].includes(way.tags.highway)) {
        return [0.95294118, 0.60392157, 0.54117647];
    }

    if(way.tags.highway === "service") {
        return [0.85,0.85,0.85];
    }

    if(way.tags.waterway === "stream") {
        return [0.666, 0.82745098, 0.8745098];
    }

    return [0,0,0];
}
  
export const wayWidth = (way) => {
    if(["primary"].includes(way.tags.highway)) {
        return 18;
    }

    if(["residential", "secondary", "tertiary", "tertiary_link", "living_street", "primary_link"].includes(way.tags.highway)) {
        return 12;
    }

    if(["footway", "steps", "path", "track"].includes(way.tags.highway) || way.tags.waterway === "stream") {
        return 2;
    }

    if(["service", "pedestrian"].includes(way.tags.highway)) {
        return 7;
    }

    if(["rail"].includes(way.tags.railway)) {
        return 3;
    }

    return 7;
}
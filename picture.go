package earthpic

import "math"

// A Pixel is a solid color sampled somewhere on the
// surface of the Earth.
type Pixel struct {
	Lat float64
	Lon float64
	R   float64
	G   float64
	B   float64
}

// Picture is a picture of the Earth, i.e. a list of
// sampled pixels.
type Picture []Pixel

// Get returns the red, green, and blue color at the
// given latitude and longitude on this picture.
// The latitude and longitude needn't perfectly match
// those of any pixel in the picture.
func (p Picture) Get(lat, lon float64) (r, g, b float64) {
	var shortDist float64
	var nearest Pixel
	for i, pixel := range p {
		dist := latLonDistance(pixel.Lat, pixel.Lon, lat, lon)
		if dist < shortDist || i == 0 {
			shortDist = dist
			nearest = pixel
		}
	}
	return nearest.R, nearest.G, nearest.B
}

// latLonDistance is a measure of distance between global
// coordinates which accounts for wrapping.
func latLonDistance(lat1, lon1, lat2, lon2 float64) float64 {
	latDist := math.Min(math.Abs(lat1-lat2), math.Min(math.Abs(180+lat1-lat2),
		math.Abs(180+lat2-lat1)))
	lonDist := math.Min(math.Abs(lon1-lon2), math.Min(math.Abs(360+lon1-lon2),
		math.Abs(360+lon2-lon1)))
	return math.Sqrt(latDist*latDist + lonDist*lonDist)
}

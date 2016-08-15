package earthpic

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"math"
	"strconv"
)

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
type Picture struct {
	Pixels []Pixel
}

// At returns the red, green, and blue color at the
// given latitude and longitude on this picture.
// The latitude and longitude needn't perfectly match
// those of any pixel in the picture.
func (p *Picture) At(lat, lon float64) (r, g, b float64) {
	var shortDist float64
	var nearest Pixel
	for i, pixel := range p.Pixels {
		dist := latLonDistance(pixel.Lat, pixel.Lon, lat, lon)
		if dist < shortDist || i == 0 {
			shortDist = dist
			nearest = pixel
		}
	}
	return nearest.R, nearest.G, nearest.B
}

// MarshalText generates CSV for this picture.
func (p *Picture) MarshalText() ([]byte, error) {
	var res bytes.Buffer
	w := csv.NewWriter(&res)
	for _, pixel := range p.Pixels {
		entry := make([]string, 5)
		nums := []float64{pixel.Lat, pixel.Lon, pixel.R, pixel.G, pixel.B}
		for i, val := range nums {
			if float64(int(val)) == val {
				entry[i] = fmt.Sprintf("%v", val)
			} else {
				entry[i] = fmt.Sprintf("%.3f", val)
			}
		}
		w.Write(entry)
	}
	w.Flush()
	return res.Bytes(), nil
}

// UnmarshalText reads the CSV representation of a picture
// and overwrites p with those pixels.
func (p *Picture) UnmarshalText(text []byte) error {
	reader := csv.NewReader(bytes.NewBuffer(text))
	records, err := reader.ReadAll()
	if err != nil {
		return err
	}
	p.Pixels = make([]Pixel, len(records))
	for i, record := range records {
		if len(record) != 5 {
			return fmt.Errorf("unexpected size of record: %d", len(record))
		}
		var numList [5]float64
		for i, entry := range record {
			numList[i], err = strconv.ParseFloat(entry, 64)
			if err != nil {
				return fmt.Errorf("not a number: %s", entry)
			}
		}
		p.Pixels[i] = Pixel{Lat: numList[0], Lon: numList[1], R: numList[2],
			G: numList[3], B: numList[4]}
	}
	return nil
}

// latLonDistance is a measure of distance between positions
// on a globe.
func latLonDistance(lat1, lon1, lat2, lon2 float64) float64 {
	latDist := math.Abs(lat1 - lat2)
	lonDist := math.Min(math.Abs(lon1-lon2), math.Min(math.Abs(360+lon1-lon2),
		math.Abs(360+lon2-lon1)))
	return math.Sqrt(latDist*latDist + lonDist*lonDist)
}

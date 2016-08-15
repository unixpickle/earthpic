// command renderimg renders an orthographic projection
// of a 3D image.
package main

import (
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io/ioutil"
	"math"
	"os"

	"github.com/unixpickle/earthpic"
)

const ImageSize = 200

func main() {
	if len(os.Args) != 3 {
		fmt.Fprintln(os.Stderr, "Usage:", os.Args[0], "input.csv output.png")
		os.Exit(1)
	}

	var pic earthpic.Picture
	inData, err := ioutil.ReadFile(os.Args[1])
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error reading input:", err)
		os.Exit(1)
	}
	if err := pic.UnmarshalText(inData); err != nil {
		fmt.Fprintln(os.Stderr, "Error parsing input:", err)
		os.Exit(1)
	}

	res := image.NewRGBA(image.Rect(0, 0, ImageSize, ImageSize))

	for imageY := 0; imageY < ImageSize; imageY++ {
		rawY := float64(imageY)/(ImageSize/2) - 1
		lat := math.Asin(rawY) * 180 / math.Pi
		for imageX := 0; imageX < ImageSize; imageX++ {
			rawX := float64(imageX)/(ImageSize/2) - 1
			lonCos := rawX / math.Cos(lat*math.Pi/180)
			lon := math.Acos(lonCos) * 180 / math.Pi
			if math.IsNaN(lon) {
				continue
			}
			r, g, b := pic.At(lat, lon)
			res.Set(imageX, imageY, color.RGBA{
				R: uint8(r*0xff + 0.5),
				G: uint8(g*0xff + 0.5),
				B: uint8(b*0xff + 0.5),
				A: 0xff,
			})
		}
	}

	outFile, err := os.Create(os.Args[2])
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error creating output:", err)
		os.Exit(1)
	}
	defer outFile.Close()
	if err := png.Encode(outFile, res); err != nil {
		fmt.Fprintln(os.Stderr, "Error writing output:", err)
		os.Exit(1)
	}
}

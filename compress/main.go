// Command compress simplifies a 3D image's rows so that
// the image takes up less storage space and CPU time
// when rendering on the web client.
//
// The compressed images are only valid for clients which
// render images by first comparing latitudes, then
// longitudes, since the compression works by deleting
// redundant row-wise pixels.
package main

import (
	"fmt"
	"io/ioutil"
	"os"

	"github.com/unixpickle/earthpic"
)

func main() {
	if len(os.Args) != 3 {
		fmt.Fprintln(os.Stderr, "Usage:", os.Args[0], "<input.csv> <output.csv>")
		os.Exit(1)
	}
	inImg, err := ReadPicture(os.Args[1])
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error reading input:", err)
		os.Exit(1)
	}
	CompressImage(inImg)
	out, _ := inImg.RawPicture().MarshalText()
	if err := ioutil.WriteFile(os.Args[2], out, 0755); err != nil {
		fmt.Fprintln(os.Stderr, "Error writing output:", err)
		os.Exit(1)
	}
}

func CompressImage(p *Picture) {
	for i, row := range p.Rows {
		for i := 1; i < len(row)-1; i++ {
			if SameColors(row[i-1], row[i]) && SameColors(row[i+1], row[i]) {
				copy(row[i:], row[i+1:])
				row = row[:len(row)-1]
				i--
			}
		}
		p.Rows[i] = row
	}
}

func SameColors(p1, p2 earthpic.Pixel) bool {
	return p1.R == p2.R && p1.G == p2.G && p1.B == p2.B
}
